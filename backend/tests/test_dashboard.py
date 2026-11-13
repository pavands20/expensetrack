"""GET /api/dashboard/me and the smoke-test seed."""

import secrets

import pytest
from sqlalchemy import select

from app import main
from app.models import Claim, User, record_status_change
from app.security import hash_password

KEYS = ["draft", "submitted", "manager_approved", "approved", "paid"]


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


def _mk(db, pw, email, role):
    u = User(name=email, email=email, password_hash=hash_password(pw), role=role)
    db.add(u)
    db.commit()
    return u


def _hdr(client, pw, email):
    t = client.post("/api/auth/login", json={"email": email, "password": pw}).json()["token"]
    return {"Authorization": f"Bearer {t}"}


def _claim(db, owner, status):
    c = Claim(owner_id=owner.id, status=status)
    db.add(c)
    db.commit()
    return c


def test_ac080_groups_and_counts(client, db_session, pw):
    e = _mk(db_session, pw, "e@x.com", "Employee")
    ids = {}
    for status, key in (
        ("draft", "draft"),
        ("pending_manager", "submitted"),
        ("pending_finance", "manager_approved"),
        ("approved", "approved"),
        ("paid", "paid"),
    ):
        ids[key] = [_claim(db_session, e, status).id for _ in range(2)]
    r = client.get("/api/dashboard/me", headers=_hdr(client, pw, "e@x.com"))
    assert r.status_code == 200
    body = r.json()
    for k in KEYS:
        assert body["counts"][k] == 2
        assert [c["id"] for c in body["claims"][k]] == sorted(ids[k], reverse=True)


def test_ac081_rejected_in_draft_with_last_rejection(client, db_session, pw):
    e = _mk(db_session, pw, "e@x.com", "Employee")
    f = _mk(db_session, pw, "f@x.com", "Finance")
    c = _claim(db_session, e, "draft")
    record_status_change(db_session, c, "pending_finance", "draft", f, "Wrong")
    db_session.commit()
    body = client.get("/api/dashboard/me", headers=_hdr(client, pw, "e@x.com")).json()
    assert body["counts"]["draft"] == 1
    assert body["claims"]["draft"][0]["last_rejection"]["comment"] == "Wrong"
    assert body["claims"]["draft"][0]["last_rejection"]["decided_by_name"] == "f@x.com"


@pytest.mark.parametrize("role", ["Employee", "Manager", "Finance"])
def test_ac082_only_own_claims(client, db_session, pw, role):
    me = _mk(db_session, pw, "me@x.com", role)
    other = _mk(db_session, pw, "o@x.com", "Employee")
    mine = _claim(db_session, me, "draft")
    _claim(db_session, other, "draft")
    body = client.get("/api/dashboard/me", headers=_hdr(client, pw, "me@x.com")).json()
    assert [c["id"] for c in body["claims"]["draft"]] == [mine.id]
    assert body["counts"]["draft"] == 1


def test_ac083_empty_and_unauthenticated(client, db_session, pw):
    _mk(db_session, pw, "e@x.com", "Employee")
    body = client.get("/api/dashboard/me", headers=_hdr(client, pw, "e@x.com")).json()
    assert body["counts"] == dict.fromkeys(KEYS, 0)
    assert body["claims"] == {k: [] for k in KEYS}
    r = client.get("/api/dashboard/me")
    assert r.status_code == 401 and r.json() == {"detail": "Not authenticated"}


def test_smoke_seed_idempotent_and_unset(db_session, monkeypatch):
    from app import main as m

    monkeypatch.setattr(m, "SessionLocal", lambda: db_session)
    monkeypatch.setattr(db_session, "close", lambda: None)
    monkeypatch.delenv("SMOKE_TEST_EMAIL", raising=False)
    monkeypatch.delenv("SMOKE_TEST_PASSWORD", raising=False)
    main._seed_smoke()
    assert db_session.scalar(select(User)) is None
    monkeypatch.setenv("SMOKE_TEST_EMAIL", "Smoke@X.com")
    monkeypatch.setenv("SMOKE_TEST_PASSWORD", secrets.token_urlsafe(12))
    main._seed_smoke()
    main._seed_smoke()
    users = list(db_session.scalars(select(User)))
    assert len(users) == 1
    assert users[0].email == "smoke@x.com" and users[0].role == "Employee"
