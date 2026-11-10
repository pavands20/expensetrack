from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app import auth
from app.models import Session, User

GENERIC = {"detail": "Invalid email or password"}


def make_user(db, email="a@example.com", password="pw-12345", role="employee", active=True):
    user = User(
        name="A", email=email, password_hash=auth.hash_password(password), role=role,
        is_active=active,
    )
    db.add(user)
    db.commit()
    return user


def login(client, email="a@example.com", password="pw-12345"):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def hdr(token):
    return {"Authorization": f"Bearer {token}"}


def test_ac017_login_and_me(client, db_session):
    make_user(db_session)
    r = login(client)
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    me = client.get("/api/auth/me", headers=hdr(body["token"]))
    assert me.status_code == 200
    assert me.json()["email"] == "a@example.com"
    assert "set-cookie" not in r.headers


def test_ac018_generic_401(client, db_session):
    make_user(db_session)
    make_user(db_session, email="off@example.com", active=False)
    for email, pw in [
        ("a@example.com", "bad"),
        ("nobody@example.com", "pw-12345"),
        ("off@example.com", "pw-12345"),
    ]:
        r = login(client, email, pw)
        assert r.status_code == 401
        assert r.json() == GENERIC


def test_ac019_protected_requires_bearer(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/logout").status_code == 401
    assert client.get("/api/auth/me", headers=hdr("junk")).status_code == 401
    assert client.get("/api/healthz").json() == {"status": "ok"}


def test_ac020_hashes_only(client, db_session):
    make_user(db_session)
    token = login(client).json()["token"]
    user = db_session.scalar(select(User))
    assert user.password_hash.startswith("$argon2id$")
    assert "pw-12345" not in user.password_hash
    sess = db_session.scalar(select(Session))
    assert sess.token_hash == auth.hash_token(token) != token


def test_ac021_logout_revokes(client, db_session):
    make_user(db_session)
    token = login(client).json()["token"]
    assert client.post("/api/auth/logout", headers=hdr(token)).status_code == 204
    assert client.get("/api/auth/me", headers=hdr(token)).status_code == 401


def test_ac022_idle_expiry_and_refresh(client, db_session, monkeypatch):
    make_user(db_session)
    token = login(client).json()["token"]
    sess = db_session.scalar(select(Session))
    sess.last_used_at = datetime.now(UTC) - timedelta(minutes=10)
    db_session.commit()
    assert client.get("/api/auth/me", headers=hdr(token)).status_code == 200
    refreshed = db_session.scalar(select(Session)).last_used_at
    assert datetime.now(UTC) - auth._aware(refreshed) < timedelta(minutes=1)
    monkeypatch.setenv("SESSION_IDLE_MINUTES", "5")
    sess.last_used_at = datetime.now(UTC) - timedelta(minutes=10)
    db_session.commit()
    assert client.get("/api/auth/me", headers=hdr(token)).status_code == 401


def test_ac023_inactive_user_revokes(client, db_session):
    user = make_user(db_session)
    token = login(client).json()["token"]
    user.is_active = False
    db_session.commit()
    assert client.get("/api/auth/me", headers=hdr(token)).status_code == 401
    assert db_session.scalar(select(Session)).revoked_at is not None


def test_password_reset_request_generic(client, db_session):
    make_user(db_session)
    make_user(db_session, email="off@example.com", active=False)
    bodies = []
    for email in ["a@example.com", "off@example.com", "none@example.com"]:
        r = client.post("/api/auth/password-reset/request", json={"email": email})
        assert r.status_code == 202
        bodies.append(r.json())
    assert bodies[0] == bodies[1] == bodies[2]


def test_require_role_forbidden(db_session):
    import pytest
    from fastapi import HTTPException

    user = make_user(db_session)
    with pytest.raises(HTTPException) as exc:
        auth.require_role("finance")(user)
    assert exc.value.status_code == 403


def test_bootstrap_finance_user(db_session, monkeypatch):
    monkeypatch.setenv("BOOTSTRAP_FINANCE_EMAIL", "Boss@Example.com")
    monkeypatch.setenv("BOOTSTRAP_FINANCE_PASSWORD", "pw-boot-1")
    auth.seed_bootstrap_user(db_session)
    auth.seed_bootstrap_user(db_session)
    users = db_session.scalars(select(User)).all()
    assert len(users) == 1
    assert users[0].role == "finance" and users[0].email == "boss@example.com"
