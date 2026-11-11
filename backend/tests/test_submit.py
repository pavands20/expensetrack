"""Submit a claim and the approvals queue."""

import secrets

import pytest

from app.models import ClaimLine, User
from app.security import hash_password
from app.services.categories import seed_categories


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


def _mk(db, pw, email, role, manager_id=None, active=True):
    u = User(
        name=email,
        email=email,
        password_hash=hash_password(pw),
        role=role,
        manager_id=manager_id,
        is_active=active,
    )
    db.add(u)
    db.commit()
    return u


def _hdr(client, pw, email):
    t = client.post("/api/auth/login", json={"email": email, "password": pw}).json()["token"]
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture
def world(client, db_session, pw):
    seed_categories(db_session)
    mgr = _mk(db_session, pw, "m@x.com", "Manager")
    _mk(db_session, pw, "e1@x.com", "Employee", mgr.id)
    _mk(db_session, pw, "e2@x.com", "Employee")
    _mk(db_session, pw, "f@x.com", "Finance")
    _mk(db_session, pw, "f2@x.com", "Finance")
    return {n: _hdr(client, pw, f"{n}@x.com") for n in ("m", "e1", "e2", "f", "f2")}


def _claim(client, db_session, h, lines=1, receipts=True):
    cid = client.post("/api/claims", json={}, headers=h).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    for _ in range(lines):
        client.post(f"/api/claims/{cid}/lines", json=body, headers=h)
    if receipts:
        for ln in db_session.query(ClaimLine).filter_by(claim_id=cid):
            ln.receipt_key = f"k{ln.id}"
        db_session.commit()
    return cid


def _submit(client, cid, h):
    return client.post(f"/api/claims/{cid}/submit", headers=h)


def test_ac048_submit_locks_claim(client, world, db_session):
    h = world["e1"]
    cid = _claim(client, db_session, h)
    r = _submit(client, cid, h)
    assert r.status_code == 200 and r.json()["status"] == "pending_manager"
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    assert client.post(f"/api/claims/{cid}/lines", json=body, headers=h).status_code == 409
    assert client.delete(f"/api/claims/{cid}", headers=h).status_code == 409
    assert _submit(client, cid, h).status_code == 409


def test_ac049_no_lines_422(client, world, db_session):
    h = world["e1"]
    cid = _claim(client, db_session, h, lines=0)
    r = _submit(client, cid, h)
    assert r.status_code == 422
    assert r.json()["detail"]["missing_receipt_line_ids"] == []
    assert client.get(f"/api/claims/{cid}", headers=h).json()["status"] == "draft"


def test_ac043_missing_receipts_listed(client, world, db_session):
    h = world["e1"]
    cid = _claim(client, db_session, h, lines=3)
    ids = sorted(ln.id for ln in db_session.query(ClaimLine).filter_by(claim_id=cid))
    ln = db_session.get(ClaimLine, ids[0])
    ln.receipt_key = None
    db_session.get(ClaimLine, ids[2]).receipt_key = None
    db_session.commit()
    r = _submit(client, cid, h)
    assert r.status_code == 422
    assert r.json()["detail"]["missing_receipt_line_ids"] == [ids[0], ids[2]]
    assert client.get(f"/api/claims/{cid}", headers=h).json()["status"] == "draft"


def test_ac050_manager_queue(client, world, db_session):
    cid = _claim(client, db_session, world["e1"])
    assert _submit(client, cid, world["e1"]).json()["status"] == "pending_manager"
    q = client.get("/api/approvals/queue", headers=world["m"])
    assert [c["id"] for c in q.json()] == [cid]
    assert client.get("/api/approvals/queue", headers=world["f"]).json() == []


def test_ac051_no_manager_goes_to_finance(client, world, db_session):
    cid = _claim(client, db_session, world["e2"])
    assert _submit(client, cid, world["e2"]).json()["status"] == "pending_finance"
    assert [c["id"] for c in client.get("/api/approvals/queue", headers=world["f"]).json()] == [cid]
    assert client.get("/api/approvals/queue", headers=world["m"]).json() == []


def test_ac051_inactive_manager_goes_to_finance(client, world, db_session):
    db_session.query(User).filter_by(email="m@x.com").one().is_active = False
    db_session.commit()
    cid = _claim(client, db_session, world["e1"])
    assert _submit(client, cid, world["e1"]).json()["status"] == "pending_finance"


def test_ac051_finance_own_claim_not_in_own_queue(client, world, db_session):
    cid = _claim(client, db_session, world["f"])
    assert _submit(client, cid, world["f"]).json()["status"] == "pending_finance"
    assert client.get("/api/approvals/queue", headers=world["f"]).json() == []
    assert [c["id"] for c in client.get("/api/approvals/queue", headers=world["f2"]).json()] == [
        cid
    ]


def test_queue_rules_employee_403_newest_first(client, world, db_session):
    assert client.get("/api/approvals/queue", headers=world["e1"]).status_code == 403
    assert client.get("/api/approvals/queue").status_code == 401
    a = _claim(client, db_session, world["e1"])
    b = _claim(client, db_session, world["e1"])
    _submit(client, a, world["e1"])
    _submit(client, b, world["e1"])
    ids = [c["id"] for c in client.get("/api/approvals/queue", headers=world["m"]).json()]
    assert ids == [b, a]


def test_nfr004_submit_access(client, world, db_session):
    cid = _claim(client, db_session, world["e1"])
    assert _submit(client, cid, world["m"]).status_code == 403
    assert _submit(client, cid, world["e2"]).status_code == 404
    assert _submit(client, 9999, world["e1"]).status_code == 404
    assert _submit(client, cid, {}).status_code == 401
