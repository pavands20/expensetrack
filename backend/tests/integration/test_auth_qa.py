"""QA suite for US-001-1 auth/session behaviour (real PostgreSQL)."""

import secrets
from datetime import timedelta

import pytest
from sqlalchemy import text

from app.auth import hash_password, revoke_user_sessions
from app.models import AuthSession, User, utcnow


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


def mk(db, email, pw, role="employee", active=True):
    u = User(name="N", email=email, password_hash=hash_password(pw), role=role, is_active=active)
    db.add(u)
    db.commit()
    return u


def login(client, email, pw):
    return client.post("/api/auth/login", json={"email": email, "password": pw})


def auth(client, email, pw):
    r = login(client, email, pw)
    assert r.status_code == 200
    return {"Authorization": "Bearer " + r.json()["token"]}


def test_ac017_login_then_me(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    r = login(client, "a@x.com", pw)
    body = r.json()
    assert r.status_code == 200 and body["token"] and body["user"]["email"] == "a@x.com"
    me = client.get("/api/auth/me", headers={"Authorization": "Bearer " + body["token"]})
    assert me.status_code == 200 and me.json()["email"] == "a@x.com"


def test_ac018_identical_401_body(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    mk(db_session, "off@x.com", pw, active=False)
    rs = [
        login(client, "a@x.com", "wrong" + pw),
        login(client, "nobody@x.com", pw),
        login(client, "off@x.com", pw),
    ]
    assert {r.status_code for r in rs} == {401}
    assert len({r.text for r in rs}) == 1


def test_ac019_protected_401(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    assert client.get("/api/auth/me").status_code == 401
    for h in (
        {"Authorization": "Bearer"},
        {"Authorization": "garbage"},
        {"Authorization": "Bearer not-a-real-token"},
        {"Authorization": "Basic abc"},
    ):
        assert client.get("/api/auth/me", headers=h).status_code == 401
    h = auth(client, "a@x.com", pw)
    db_session.query(AuthSession).update({"revoked_at": utcnow()})
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert client.get("/api/users").status_code == 401


def test_ac020_nfr001_nothing_plaintext(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    token = login(client, "a@x.com", pw).json()["token"]
    rows = db_session.execute(text("select * from users")).mappings().all()
    assert rows and rows[0]["password_hash"].startswith("$argon2id$")
    for row in rows:
        assert all(pw not in str(v) for v in row.values())
    srows = db_session.execute(text("select * from sessions")).mappings().all()
    assert srows
    for row in srows:
        assert all(token not in str(v) for v in row.values())


def test_ac021_logout(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    h = auth(client, "a@x.com", pw)
    assert client.post("/api/auth/logout", headers=h).status_code == 204
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_ac022_idle_window(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    h = auth(client, "a@x.com", pw)
    s = db_session.query(AuthSession).one()
    before = utcnow() - timedelta(minutes=10)
    s.last_used_at = before
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 200
    db_session.expire_all()
    assert db_session.query(AuthSession).one().last_used_at > before
    db_session.query(AuthSession).update({"last_used_at": utcnow() - timedelta(hours=2)})
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_ac023_deactivation(client, db_session, pw):
    u = mk(db_session, "a@x.com", pw)
    h = auth(client, "a@x.com", pw)
    u.is_active = False
    db_session.commit()
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_ac023_revoke_user_sessions(client, db_session, pw):
    u = mk(db_session, "a@x.com", pw)
    h = auth(client, "a@x.com", pw)
    h2 = auth(client, "a@x.com", pw)
    revoke_user_sessions(db_session, u.id)
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert client.get("/api/auth/me", headers=h2).status_code == 401


def test_ac010_reset_identical(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    mk(db_session, "off@x.com", pw, active=False)
    rs = [
        client.post("/api/auth/password-reset/request", json={"email": e})
        for e in ("a@x.com", "none@x.com", "off@x.com")
    ]
    assert {r.status_code for r in rs} == {202}
    assert len({r.text for r in rs}) == 1


def test_ac017_no_set_cookie_on_auth_responses(client, db_session, pw):
    mk(db_session, "a@x.com", pw)
    h = auth(client, "a@x.com", pw)
    rs = [
        login(client, "a@x.com", pw),
        login(client, "a@x.com", "bad"),
        client.get("/api/auth/me", headers=h),
        client.get("/api/auth/me"),
        client.post("/api/auth/password-reset/request", json={"email": "a@x.com"}),
        client.post("/api/auth/logout", headers=h),
    ]
    assert all("set-cookie" not in r.headers for r in rs)


def test_nfr004_admin_endpoints_finance_only(client, db_session, pw):
    mk(db_session, "e@x.com", pw, "employee")
    mk(db_session, "m@x.com", pw, "manager")
    mk(db_session, "f@x.com", pw, "finance")
    assert client.get("/api/users").status_code == 401
    for e in ("e@x.com", "m@x.com"):
        h = auth(client, e, pw)
        assert client.get("/api/users", headers=h).status_code == 403
        assert client.post("/api/users/1/deactivate", headers=h).status_code == 403
    assert client.get("/api/users", headers=auth(client, "f@x.com", pw)).status_code == 200
