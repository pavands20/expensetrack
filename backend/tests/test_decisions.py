"""Decision endpoint unit tests (US-014-2)."""

import secrets

import pytest
from fastapi import HTTPException

from app.models import Claim, ClaimLine, User
from app.security import hash_password
from app.services.categories import seed_categories
from app.services.decisions import assert_not_submitter


def _mk(db, pw, email, role, manager_id=None):
    u = User(
        name=email,
        email=email,
        password_hash=hash_password(pw),
        role=role,
        manager_id=manager_id,
    )
    db.add(u)
    db.commit()
    return u


@pytest.fixture
def world(client, db_session):
    pw = secrets.token_urlsafe(12)
    seed_categories(db_session)
    m = _mk(db_session, pw, "m@x.com", "Manager")
    _mk(db_session, pw, "e@x.com", "Employee", m.id)
    _mk(db_session, pw, "m2@x.com", "Manager")
    _mk(db_session, pw, "f@x.com", "Finance")
    _mk(db_session, pw, "f2@x.com", "Finance")
    h = {}
    for n in ("m", "e", "m2", "f", "f2"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}
    return h


def _submitted(client, db_session, h):
    cid = client.post("/api/claims", json={}, headers=h).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    client.post(f"/api/claims/{cid}/lines", json=body, headers=h)
    for ln in db_session.query(ClaimLine).filter_by(claim_id=cid):
        ln.receipt_key = "k"
    db_session.commit()
    assert client.post(f"/api/claims/{cid}/submit", headers=h).status_code == 200
    return cid


def _d(client, cid, h, decision, comment=None):
    return client.post(
        f"/api/claims/{cid}/decision", json={"decision": decision, "comment": comment}, headers=h
    )


def test_ac052_ac057_approve_chain(client, world, db_session):
    cid = _submitted(client, db_session, world["e"])
    assert _d(client, cid, world["m"], "approve", "ok").json()["status"] == "pending_finance"
    assert _d(client, cid, world["m"], "approve").status_code == 409
    assert _d(client, cid, world["f"], "approve").json()["status"] == "approved"
    rows = client.get(f"/api/claims/{cid}/history", headers=world["f"]).json()
    assert [r["new_status"] for r in rows] == ["pending_manager", "pending_finance", "approved"]


def test_ac053_ac054_ac058_reject(client, world, db_session):
    cid = _submitted(client, db_session, world["e"])
    for c in (None, "", "  "):
        r = _d(client, cid, world["m"], "reject", c)
        assert r.status_code == 422
        assert r.json()["detail"] == "A comment is required to reject a claim"
    r = _d(client, cid, world["m"], "reject", "bad").json()
    assert r["status"] == "draft" and r["last_rejection"]["comment"] == "bad"
    assert r["last_rejection"]["decided_by_name"] == "m@x.com"
    assert len(r["lines"]) == 1


def test_ac055_ac059_self_and_non_report(client, world, db_session):
    cid = _submitted(client, db_session, world["e"])
    assert _d(client, cid, world["m2"], "approve").status_code == 404
    assert _d(client, cid, world["e"], "approve").status_code == 403
    assert _d(client, cid, world["f"], "approve").status_code == 409
    own = _submitted(client, db_session, world["m"])
    assert _d(client, own, world["m"], "approve").status_code == 403
    assert _d(client, own, world["m2"], "approve").status_code == 404


def test_ac060_ac068_finance_own_claim(client, world, db_session):
    cid = _submitted(client, db_session, world["f"])
    assert _d(client, cid, world["f"], "approve").status_code == 403
    assert _d(client, cid, world["f2"], "approve").json()["status"] == "approved"


def test_ac056_over_limit(client, world, db_session):
    client.patch("/api/categories/1", json={"limit_gbp": "4.00"}, headers=world["f"])
    cid = _submitted(client, db_session, world["e"])
    assert client.get(f"/api/claims/{cid}", headers=world["m"]).json()["lines"][0]["over_limit"]
    client.patch("/api/categories/1", json={"limit_gbp": "5.00"}, headers=world["f"])
    got = client.get(f"/api/claims/{cid}", headers=world["m"]).json()
    assert not got["lines"][0]["over_limit"]


def test_ac059_helper_and_invalid_decision(client, world, db_session):
    with pytest.raises(HTTPException) as e:
        assert_not_submitter(Claim(owner_id=1), User(id=1))
    assert e.value.status_code == 403
    assert_not_submitter(Claim(owner_id=1), User(id=2))
    cid = _submitted(client, db_session, world["e"])
    assert _d(client, cid, world["m"], "maybe").status_code == 422
