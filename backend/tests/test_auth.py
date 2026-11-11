"""Identity foundation tests."""

import secrets
from datetime import timedelta

import pytest
from sqlalchemy import select

from app.deps import aware
from app.models import PasswordResetToken, User, UserSession, utcnow
from app.security import hash_password, hash_token


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


@pytest.fixture
def user(db_session, pw):
    u = User(name="A", email="a@x.com", password_hash=hash_password(pw), role="Employee")
    db_session.add(u)
    db_session.commit()
    return u


def _login(client, pw, email="a@x.com"):
    return client.post("/api/auth/login", json={"email": email, "password": pw})


def _auth(client, pw):
    return {"Authorization": f"Bearer {_login(client, pw).json()['token']}"}


def test_ac017_login_returns_token_usable_as_bearer(client, user, pw):
    r = _login(client, pw, "A@X.com")
    assert r.status_code == 200
    tok = r.json()["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert me.status_code == 200 and me.json()["email"] == "a@x.com"


def test_ac018_identical_401(client, user, pw, db_session):
    bad = _login(client, "wrong-password")
    unk = _login(client, pw, "nobody@x.com")
    user.is_active = False
    db_session.commit()
    off = _login(client, pw)
    for r in (bad, unk, off):
        assert r.status_code == 401
        assert r.json() == {"detail": "Invalid email or password"}


def test_ac019_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/logout").status_code == 401
    assert client.get("/api/healthz").json() == {"status": "ok"}
    assert client.get("/health").status_code == 200


def test_ac020_hashes_only(client, user, pw, db_session):
    tok = _login(client, pw).json()["token"]
    s = db_session.scalar(select(UserSession))
    assert s.token_hash != tok and len(s.token_hash) == 64
    assert user.password_hash.startswith("$argon2id$")


def test_ac021_logout_revokes(client, user, pw):
    h = _auth(client, pw)
    assert client.post("/api/auth/logout", headers=h).status_code == 204
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_ac022_idle_expiry(client, user, pw, db_session):
    h = _auth(client, pw)
    s = db_session.scalar(select(UserSession))
    s.last_seen_at = utcnow() - timedelta(minutes=31)
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_ac022_last_seen_slides(client, user, pw, db_session):
    h = _auth(client, pw)
    s = db_session.scalar(select(UserSession))
    s.last_seen_at = utcnow() - timedelta(minutes=20)
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 200
    db_session.refresh(s)
    seen = aware(s.last_seen_at)
    assert utcnow() - seen < timedelta(minutes=1)


def test_ac023_inactive_user_session(client, user, pw, db_session):
    h = _auth(client, pw)
    user.is_active = False
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401
    user.is_active = True
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_password_reset_flow(client, user, pw, db_session):
    h = _auth(client, pw)
    r = client.post("/api/auth/password-reset/request", json={"email": "nobody@x.com"})
    assert r.status_code == 202
    client.post("/api/auth/password-reset/request", json={"email": "a@x.com"})
    raw = secrets.token_urlsafe(8)
    row = db_session.scalar(select(PasswordResetToken))
    row.token_hash = hash_token(raw)
    db_session.commit()
    new = secrets.token_urlsafe(12)
    body = {"token": raw, "new_password": new}
    assert client.post("/api/auth/password-reset/confirm", json=body).status_code == 204
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert client.post("/api/auth/password-reset/confirm", json=body).status_code == 400
    assert _login(client, new).status_code == 200


def test_require_finance_403():
    from fastapi import HTTPException

    from app.deps import require_finance

    with pytest.raises(HTTPException) as e:
        require_finance(User(role="Employee"))
    assert e.value.status_code == 403
