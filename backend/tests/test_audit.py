"""Claim status audit trail."""

import secrets

import pytest

from app.models import Claim, ClaimLine, ClaimStatusChange, User, record_status_change
from app.security import hash_password
from app.services.categories import seed_categories


def _mk(db, pw, email, role, manager_id=None):
    u = User(
        name=f"N-{email}",
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
    e = _mk(db_session, pw, "e@x.com", "Employee", m.id)
    _mk(db_session, pw, "o@x.com", "Employee")
    _mk(db_session, pw, "f@x.com", "Finance")
    h = {}
    for n in ("m", "e", "o", "f"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}
    return h, e


def _submitted(client, db_session, h):
    cid = client.post("/api/claims", json={}, headers=h).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    client.post(f"/api/claims/{cid}/lines", json=body, headers=h)
    for ln in db_session.query(ClaimLine).filter_by(claim_id=cid):
        ln.receipt_key = "k"
    db_session.commit()
    assert client.post(f"/api/claims/{cid}/submit", headers=h).status_code == 200
    return cid


def test_ac095_submit_writes_entry(client, world, db_session):
    h, e = world
    cid = _submitted(client, db_session, h["e"])
    r = client.get(f"/api/claims/{cid}/history", headers=h["e"])
    assert r.status_code == 200
    (row,) = r.json()
    assert row["old_status"] == "draft" and row["new_status"] == "pending_manager"
    assert row["actor_id"] == e.id and row["actor_name"] == e.name
    assert row["comment"] is None and row["created_at"].endswith("+00:00")


def test_ac095_helper_does_not_commit(db_session, world):
    _, e = world
    c = Claim(owner_id=e.id)
    db_session.add(c)
    db_session.commit()
    record_status_change(db_session, c, "draft", "pending_finance", e, "hi")
    db_session.rollback()
    assert db_session.query(ClaimStatusChange).count() == 0


def test_ac096_visibility_and_order(client, world, db_session):
    h, e = world
    cid = _submitted(client, db_session, h["e"])
    claim = db_session.get(Claim, cid)
    record_status_change(db_session, claim, "pending_manager", "pending_finance", e, "ok")
    db_session.commit()
    rows = client.get(f"/api/claims/{cid}/history", headers=h["m"]).json()
    assert [r["new_status"] for r in rows] == ["pending_manager", "pending_finance"]
    assert rows[1]["comment"] == "ok"
    assert client.get(f"/api/claims/{cid}/history", headers=h["f"]).status_code == 200
    r = client.get(f"/api/claims/{cid}/history", headers=h["o"])
    assert r.status_code == 404 and r.json() == {"detail": "Claim not found"}
    assert client.get(f"/api/claims/{cid}/history").status_code == 401


def test_ac097_no_mutation(client, world, db_session):
    h, _ = world
    cid = _submitted(client, db_session, h["e"])
    url = f"/api/claims/{cid}/history"
    for m in ("patch", "put", "delete"):
        assert getattr(client, m)(url, headers=h["f"]).status_code in (404, 405)
    entry = db_session.query(ClaimStatusChange).one()
    entry.comment = "x"
    with pytest.raises(RuntimeError):
        db_session.flush()
    db_session.rollback()
    db_session.delete(db_session.query(ClaimStatusChange).one())
    with pytest.raises(RuntimeError):
        db_session.flush()
    db_session.rollback()


def test_nfr009_name_kept_after_deactivation(client, world, db_session):
    h, e = world
    cid = _submitted(client, db_session, h["e"])
    db_session.get(User, e.id).is_active = False
    db_session.commit()
    rows = client.get(f"/api/claims/{cid}/history", headers=h["f"]).json()
    assert rows[0]["actor_name"] == e.name
    assert not ClaimStatusChange.__table__.c.claim_id.foreign_keys
