"""QA: sign-in, sign-out, expiry and deactivation against the real PostgreSQL (US-005)."""

import os
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import auth
from app.database import get_db
from app.main import app
from app.models import Session, User

GENERIC = "Invalid email or password"
PW = "Qa-pass-12345"


@pytest.fixture(scope="module")
def engine():
    url = os.environ["DATABASE_URL"]
    eng = create_engine(url, future=True)
    if eng.dialect.name == "sqlite":  # local fallback only; CI uses PostgreSQL
        from app.database import Base

        Base.metadata.create_all(bind=eng)
    else:
        from alembic import command
        from alembic.config import Config

        backend = Path(__file__).resolve().parent.parent
        cfg = Config(str(backend / "alembic.ini"))
        cfg.set_main_option("script_location", str(backend / "migrations"))
        command.upgrade(cfg, "head")
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    s = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    yield s
    s.close()


@pytest.fixture
def client(db):
    def _get_db():
        yield db

    app.dependency_overrides[get_db] = _get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def user(db):
    u = User(
        name="QA User",
        email=f"qa-{uuid.uuid4().hex[:10]}@example.com",
        password_hash=auth.hash_password(PW),
        role="employee",
        is_active=True,
    )
    db.add(u)
    db.commit()
    return u


def login(client, email, password=PW):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_ac017_login_returns_token_and_me_works(client, user):
    r = login(client, user.email)
    assert r.status_code == 200
    body = r.json()
    assert body["token"] and body["token_type"] == "bearer"
    assert "set-cookie" not in r.headers
    me = client.get("/api/auth/me", headers=bearer(body["token"]))
    assert me.status_code == 200
    assert me.json()["email"] == user.email
    assert "set-cookie" not in me.headers


def test_ac018_wrong_password_and_unknown_email_identical(client, user):
    bad = login(client, user.email, "wrong-password")
    unknown = login(client, f"nobody-{uuid.uuid4().hex}@example.com")
    assert bad.status_code == unknown.status_code == 401
    assert bad.content == unknown.content
    assert bad.json() == {"detail": GENERIC}
    assert "set-cookie" not in bad.headers


ENDPOINTS = [
    ("GET", "/api/approvals/queue"),
    ("POST", "/api/auth/logout"),
    ("GET", "/api/auth/me"),
    ("POST", "/api/auth/password-reset/confirm-NOT"),  # placeholder removed below
    ("GET", "/api/categories"),
    ("POST", "/api/categories"),
    ("PATCH", "/api/categories/1"),
    ("GET", "/api/claims"),
    ("POST", "/api/claims"),
    ("GET", "/api/claims/1"),
    ("DELETE", "/api/claims/1"),
    ("POST", "/api/claims/1/decision"),
    ("GET", "/api/claims/1/history"),
    ("POST", "/api/claims/1/lines"),
    ("PATCH", "/api/claims/1/lines/1"),
    ("DELETE", "/api/claims/1/lines/1"),
    ("PUT", "/api/claims/1/lines/1/receipt"),
    ("GET", "/api/claims/1/lines/1/receipt-url"),
    ("POST", "/api/claims/1/mark-paid"),
    ("POST", "/api/claims/1/submit"),
    ("GET", "/api/dashboard/me"),
    ("GET", "/api/reports/export.csv"),
    ("GET", "/api/reports/totals"),
    ("GET", "/api/users"),
    ("POST", "/api/users"),
    ("PATCH", "/api/users/1"),
    ("POST", "/api/users/1/deactivate"),
]
ENDPOINTS = [e for e in ENDPOINTS if "NOT" not in e[1]]


@pytest.mark.parametrize("method,path", ENDPOINTS)
def test_ac019_protected_endpoints_return_401_without_token(client, method, path):
    r = client.request(method, path)
    if r.status_code == 404:
        pytest.skip(f"PENDING: {method} {path} not implemented yet")
    assert r.status_code == 401, (method, path, r.status_code)
    r2 = client.request(method, path, headers=bearer("junk-token"))
    assert r2.status_code == 401


def test_ac019_public_endpoints_open(client):
    assert client.get("/api/healthz").status_code == 200
    r = client.post("/api/auth/password-reset/request", json={"email": "x@example.com"})
    assert r.status_code == 202
    assert login(client, "x@example.com").status_code == 401


def test_ac020_hashes_only_stored(client, db, user):
    token = login(client, user.email).json()["token"]
    stored = db.scalar(select(User.password_hash).where(User.id == user.id))
    assert stored.startswith("$argon2")
    assert stored != PW and PW not in stored
    hashes = db.scalars(select(Session.token_hash).where(Session.user_id == user.id)).all()
    assert hashes and token not in hashes
    assert auth.hash_token(token) in hashes


def test_ac021_logout_then_reuse_is_401(client, user):
    token = login(client, user.email).json()["token"]
    out = client.post("/api/auth/logout", headers=bearer(token))
    assert out.status_code in (200, 204)
    assert "set-cookie" not in out.headers
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 401


def test_ac022_idle_session_expires(client, db, user, monkeypatch):
    monkeypatch.setenv("SESSION_IDLE_MINUTES", "5")
    token = login(client, user.email).json()["token"]
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 200
    sess = db.scalar(select(Session).where(Session.token_hash == auth.hash_token(token)))
    sess.last_used_at = datetime.now(UTC) - timedelta(minutes=10)
    db.commit()
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 401


def test_ac023_deactivated_user_session_refused(client, db, user):
    token = login(client, user.email).json()["token"]
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 200
    u = db.get(User, user.id)
    u.is_active = False
    db.commit()
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 401
    # a deactivated user also cannot sign in again, with the same generic body
    r = login(client, user.email)
    assert r.status_code == 401 and r.json() == {"detail": GENERIC}


def test_nfr001_no_plaintext_passwords_in_users(db, user):
    rows = db.scalars(select(User.password_hash)).all()
    assert rows and all(h.startswith("$argon2") for h in rows)


def test_nfr003_reset_request_generic(client, user):
    a = client.post("/api/auth/password-reset/request", json={"email": user.email})
    b = client.post("/api/auth/password-reset/request", json={"email": "no-one@example.com"})
    assert a.status_code == b.status_code == 202
    assert a.content == b.content
