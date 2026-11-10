import secrets
from datetime import timedelta

import pytest
from fastapi import Depends

from app.auth import hash_password, require_role, revoke_user_sessions
from app.main import app
from app.models import AuthSession, User, utcnow


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


@pytest.fixture
def user(db_session, pw):
    u = User(name="A", email="a@x.com", password_hash=hash_password(pw), role="employee")
    db_session.add(u)
    db_session.commit()
    return u


def login(client, email, pw):
    return client.post("/api/auth/login", json={"email": email, "password": pw})


def hdr(client, pw):
    return {"Authorization": "Bearer " + login(client, "a@x.com", pw).json()["token"]}


def test_ac017_login_returns_token_no_cookie(client, user, pw):
    r = login(client, "A@X.com", pw)
    assert r.status_code == 200
    assert r.json()["token"] and r.json()["user"]["email"] == "a@x.com"
    assert "password_hash" not in r.json()["user"]
    assert "set-cookie" not in r.headers


def test_ac018_generic_401(client, user, pw, db_session):
    user.is_active = False
    db_session.commit()
    bodies = {
        login(client, "a@x.com", pw).text,
        login(client, "a@x.com", "wrong").text,
        login(client, "no@x.com", pw).text,
    }
    assert len(bodies) == 1 and "Invalid email or password" in bodies.pop()


def test_ac019_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_ac020_hashes_stored(client, user, pw, db_session):
    token = login(client, "a@x.com", pw).json()["token"]
    assert user.password_hash.startswith("$argon2id$")
    assert db_session.query(AuthSession).one().token_hash != token


def test_ac021_logout_revokes(client, user, pw):
    h = hdr(client, pw)
    assert client.get("/api/auth/me", headers=h).status_code == 200
    assert client.post("/api/auth/logout", headers=h).status_code == 204
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_ac022_idle_expiry(client, user, pw, db_session):
    h = hdr(client, pw)
    s = db_session.query(AuthSession).one()
    s.last_used_at = utcnow() - timedelta(minutes=31)
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert db_session.query(AuthSession).one().revoked_at is not None


def test_ac023_deactivated_and_revoke_helper(client, user, pw, db_session):
    h = hdr(client, pw)
    user.is_active = False
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401
    revoke_user_sessions(db_session, user.id)
    assert db_session.query(AuthSession).one().revoked_at is not None


def test_ac010_reset_generic(client, user):
    for e in ("a@x.com", "zz@x.com"):
        r = client.post("/api/auth/password-reset/request", json={"email": e})
        assert r.status_code == 202
        assert r.json() == {"detail": "If the account exists, a reset email has been sent"}


_FIN = Depends(require_role("finance"))


def test_require_role_403(client, user, pw):
    @app.get("/_fin")
    def _fin(u=_FIN):
        return {}

    assert client.get("/_fin", headers=hdr(client, pw)).status_code == 403
