"""Auth foundation tests (AC-017..AC-023, first-admin seed, NFR-001/003) on the real database."""

import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.auth import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Role, Session, User

BACKEND = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session", autouse=True)
def _migrated() -> None:
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND / "migrations"))
    command.upgrade(cfg, "head")


@pytest.fixture(autouse=True)
def _clean(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("BOOTSTRAP_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("BOOTSTRAP_ADMIN_PASSWORD", raising=False)
    monkeypatch.delenv("SESSION_IDLE_MINUTES", raising=False)
    with SessionLocal() as db:
        db.execute(delete(Session))
        db.execute(delete(User))
        db.commit()


@pytest.fixture
def db():
    with SessionLocal() as s:
        yield s


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def pw() -> str:
    return secrets.token_urlsafe(12)


@pytest.fixture
def user(db, pw) -> User:
    u = User(
        name="Ann",
        email="ann@example.com",
        password_hash=hash_password(pw),
        role=Role.Employee,
        is_active=True,
    )
    db.add(u)
    db.commit()
    return u


def login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_ac017_login_returns_token_and_user_and_me_works(client, user, pw):
    r = login(client, "ann@example.com", pw)
    assert r.status_code == 200
    body = r.json()
    assert body["token"]
    assert body["user"]["email"] == "ann@example.com"
    me = client.get("/api/auth/me", headers=auth(body["token"]))
    assert me.status_code == 200
    assert me.json()["email"] == "ann@example.com"


def test_ac018_failures_return_identical_401(client, db, user, pw):
    inactive = User(
        name="Bob",
        email="bob@example.com",
        password_hash=hash_password(pw),
        role=Role.Employee,
        is_active=False,
    )
    db.add(inactive)
    db.commit()
    wrong = login(client, "ann@example.com", secrets.token_urlsafe(12))
    unknown = login(client, "nobody@example.com", pw)
    inact = login(client, "bob@example.com", pw)
    for r in (wrong, unknown, inact):
        assert r.status_code == 401
    assert wrong.json() == unknown.json() == inact.json()


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/auth/me"),
        ("post", "/api/auth/logout"),
        ("get", "/api/users"),
        ("post", "/api/users/1/deactivate"),
    ],
)
def test_ac019_protected_routes_require_token(client, method, path):
    assert getattr(client, method)(path).status_code == 401
    r = getattr(client, method)(path, headers=auth("not-a-real-token"))
    assert r.status_code == 401


def test_ac019_login_and_healthz_need_no_token(client):
    assert client.get("/api/healthz").status_code == 200
    r = login(client, "x@example.com", "whatever-pass")
    assert r.status_code == 401  # reached the handler; not blocked by auth guard
    assert r.json()["detail"] == "Invalid email or password"


def test_ac020_nfr001_password_hashed_and_no_raw_token(client, db, user, pw):
    token = login(client, "ann@example.com", pw).json()["token"]
    db.expire_all()
    stored = db.scalar(select(User.password_hash).where(User.email == "ann@example.com"))
    assert stored != pw
    assert stored.startswith("$argon2")
    hashes = db.scalars(select(Session.token_hash)).all()
    assert hashes
    assert token not in hashes
    assert all(token not in h for h in hashes)


def test_ac021_logout_invalidates_token(client, user, pw):
    token = login(client, "ann@example.com", pw).json()["token"]
    assert client.post("/api/auth/logout", headers=auth(token)).status_code == 204
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_ac022_idle_session_expires(client, db, user, pw):
    token = login(client, "ann@example.com", pw).json()["token"]
    s = db.scalar(select(Session))
    s.last_seen_at = datetime.now(UTC) - timedelta(minutes=31)
    db.commit()
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_ac022_idle_minutes_setting_respected(client, user, pw, monkeypatch):
    monkeypatch.setenv("SESSION_IDLE_MINUTES", "0")
    token = login(client, "ann@example.com", pw).json()["token"]
    import time

    time.sleep(0.05)
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_ac022_activity_within_window_keeps_session_alive(client, db, user, pw):
    token = login(client, "ann@example.com", pw).json()["token"]
    s = db.scalar(select(Session))
    s.last_seen_at = datetime.now(UTC) - timedelta(minutes=20)
    db.commit()
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 200
    db.expire_all()
    s = db.scalar(select(Session))
    assert datetime.now(UTC) - s.last_seen_at.astimezone(UTC) < timedelta(minutes=1)
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 200


def test_ac023_deactivated_user_token_rejected(client, db, user, pw):
    token = login(client, "ann@example.com", pw).json()["token"]
    u = db.get(User, user.id)
    u.is_active = False
    db.commit()
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_ac023_deactivate_endpoint_revokes_sessions(client, db, user, pw):
    fin_pw = secrets.token_urlsafe(12)
    db.add(
        User(
            name="Fin",
            email="fin@example.com",
            password_hash=hash_password(fin_pw),
            role=Role.Finance,
            is_active=True,
        )
    )
    db.commit()
    token = login(client, "ann@example.com", pw).json()["token"]
    ftoken = login(client, "fin@example.com", fin_pw).json()["token"]
    r = client.post(f"/api/users/{user.id}/deactivate", headers=auth(ftoken))
    assert r.status_code == 200
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_first_admin_seed_creates_one_finance_user_no_duplicate(db, monkeypatch):
    admin_pw = secrets.token_urlsafe(12)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "Admin@Example.com")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", admin_pw)
    for _ in range(2):
        with TestClient(app) as c:
            r = login(c, "admin@example.com", admin_pw)
            assert r.status_code == 200
            assert r.json()["user"]["role"] == "Finance"
    db.expire_all()
    assert len(db.scalars(select(User)).all()) == 1


def test_first_admin_not_seeded_when_unset(db):
    with TestClient(app):
        pass
    assert db.scalars(select(User)).all() == []


def test_nfr003_generic_message_same_for_known_and_unknown(client, user):
    a = login(client, "ann@example.com", "wrong-password-1")
    b = login(client, "ghost@example.com", "wrong-password-1")
    assert a.status_code == b.status_code == 401
    assert a.text == b.text
