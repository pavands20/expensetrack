"""QA acceptance: submit a claim and the approval queues (US-013), through the API."""

import secrets

import pytest

from app.models import User
from app.security import hash_password
from app.services.categories import seed_categories

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


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
def world(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    seed_categories(db_session)
    pw = secrets.token_urlsafe(12)
    mgr = _mk(db_session, pw, "m@x.com", "Manager")
    _mk(db_session, pw, "e1@x.com", "Employee", mgr.id)
    _mk(db_session, pw, "e2@x.com", "Employee")
    _mk(db_session, pw, "f@x.com", "Finance")
    _mk(db_session, pw, "f2@x.com", "Finance")
    h = {}
    for n in ("m", "e1", "e2", "f", "f2"):
        r = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {r.json()['token']}"}
    return h


def _draft(client, h, lines=1):
    cid = client.post("/api/claims", json={}, headers=h).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    for _ in range(lines):
        r = client.post(f"/api/claims/{cid}/lines", json=body, headers=h)
        lid = r.json()["lines"][-1]["id"]
        u = client.put(
            f"/api/claims/{cid}/lines/{lid}/receipt",
            files={"file": ("r", PNG, "image/png")},
            headers=h,
        )
        assert u.status_code == 200
    return cid


def _submit(client, cid, h):
    return client.post(f"/api/claims/{cid}/submit", headers=h)


def _queue(client, h):
    return [c["id"] for c in client.get("/api/approvals/queue", headers=h).json()]


def test_ac048_submit_changes_status_and_locks(client, world):
    h = world["e1"]
    cid = _draft(client, h)
    r = _submit(client, cid, h)
    assert r.status_code == 200 and r.json()["status"] != "draft"
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    assert client.post(f"/api/claims/{cid}/lines", json=body, headers=h).status_code == 409
    assert client.delete(f"/api/claims/{cid}", headers=h).status_code == 409


def test_ac049_no_lines_refused_with_message(client, world):
    h = world["e1"]
    cid = _draft(client, h, lines=0)
    r = _submit(client, cid, h)
    assert r.status_code == 422
    assert r.json()["detail"]["message"]
    assert client.get(f"/api/claims/{cid}", headers=h).json()["status"] == "draft"


def test_ac050_manager_queue(client, world):
    cid = _draft(client, world["e1"])
    assert _submit(client, cid, world["e1"]).json()["status"] == "pending_manager"
    assert cid in _queue(client, world["m"])
    assert cid not in _queue(client, world["f"])


def test_ac051_no_manager_finance_queue_excluding_owner(client, world):
    cid = _draft(client, world["e2"])
    assert _submit(client, cid, world["e2"]).json()["status"] == "pending_finance"
    assert cid in _queue(client, world["f"])
    own = _draft(client, world["f"])
    assert _submit(client, own, world["f"]).json()["status"] == "pending_finance"
    assert own not in _queue(client, world["f"])
    assert own in _queue(client, world["f2"])


def test_nfr008_access_limited_by_role(client, world):
    cid = _draft(client, world["e1"])
    _submit(client, cid, world["e1"])
    assert client.get("/api/approvals/queue").status_code == 401
    assert client.get("/api/approvals/queue", headers=world["e1"]).status_code == 403
    assert client.get(f"/api/claims/{cid}", headers=world["e2"]).status_code == 404
    assert client.get("/api/users", headers=world["e2"]).status_code == 403
    assert client.get("/api/users").status_code == 401
    # hosting region and encryption are infrastructure: not testable here
