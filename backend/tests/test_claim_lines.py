"""Edit and remove lines on a draft claim."""

import secrets

import pytest

from app import storage
from app.models import Category, Claim, ClaimLine, User
from app.security import hash_password
from app.services.categories import seed_categories


def _mk(db, pw, email, role, manager_id=None):
    db.add(
        User(
            name=email,
            email=email,
            password_hash=hash_password(pw),
            role=role,
            manager_id=manager_id,
        )
    )
    db.commit()


@pytest.fixture
def world(client, db_session):
    pw = secrets.token_urlsafe(12)
    seed_categories(db_session)
    _mk(db_session, pw, "m@x.com", "Manager")
    mgr = db_session.query(User).filter_by(email="m@x.com").one()
    _mk(db_session, pw, "e1@x.com", "Employee", mgr.id)
    _mk(db_session, pw, "e2@x.com", "Employee")
    h = {}
    for n in ("m", "e1", "e2"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}
    return h


def _draft(client, h, n=2):
    cid = client.post("/api/claims", json={}, headers=h).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "10.00", "description": "Taxi"}
    for _ in range(n):
        r = client.post(f"/api/claims/{cid}/lines", json=body, headers=h)
    return cid, [ln["id"] for ln in r.json()["lines"]]


def test_ac032_patch_changes_fields_and_total(client, world):
    h = world["e1"]
    cid, ids = _draft(client, h)
    url = f"/api/claims/{cid}/lines/{ids[0]}"
    r = client.patch(
        url,
        json={
            "date": "2026-02-01",
            "category_id": 2,
            "amount_gbp": "15.25",
            "description": " Lunch ",
        },
        headers=h,
    )
    assert r.status_code == 200
    c = r.json()
    assert c["total_gbp"] == "25.25"
    ln = next(x for x in c["lines"] if x["id"] == ids[0])
    assert ln["date"] == "2026-02-01" and ln["category_id"] == 2
    assert ln["amount_gbp"] == "15.25" and ln["description"] == "Lunch"
    r = client.patch(url, json={"description": "Only"}, headers=h)
    assert r.status_code == 200 and r.json()["total_gbp"] == "25.25"


def test_ac032_validation_and_category(client, world):
    h = world["e1"]
    cid, ids = _draft(client, h)
    url = f"/api/claims/{cid}/lines/{ids[0]}"
    assert client.patch(url, json={}, headers=h).status_code == 422
    for bad in (0, -1, "1.234", "abc"):
        r = client.patch(url, json={"amount_gbp": bad}, headers=h)
        assert r.status_code == 422
        assert ["body", "amount_gbp"] in [e["loc"] for e in r.json()["detail"]]
    for body in ({"description": " "}, {"description": "x" * 141}, {"date": "2026-13-45"}):
        assert client.patch(url, json=body, headers=h).status_code == 422
    r = client.patch(url, json={"category_id": 999}, headers=h)
    assert r.status_code == 422 and r.json()["detail"][0]["loc"] == ["body", "category_id"]
    missing = f"/api/claims/{cid}/lines/9999"
    assert client.patch(missing, json={"description": "a"}, headers=h).status_code == 404


def test_ac032_retired_category_rules(client, world, db_session):
    h = world["e1"]
    cid, ids = _draft(client, h)
    url = f"/api/claims/{cid}/lines/{ids[0]}"
    db_session.get(Category, 1).is_active = False
    db_session.get(Category, 2).is_active = False
    db_session.commit()
    assert client.patch(url, json={"category_id": 1}, headers=h).status_code == 200
    assert client.patch(url, json={"category_id": 2}, headers=h).status_code == 422


def test_ac033_delete_line_removes_receipt(client, world, db_session, monkeypatch):
    h = world["e1"]
    cid, ids = _draft(client, h)
    db_session.get(ClaimLine, ids[0]).receipt_key = "k0"
    db_session.commit()
    deleted = []
    monkeypatch.setattr(storage, "delete_object", lambda k: deleted.append(k))
    r = client.delete(f"/api/claims/{cid}/lines/{ids[0]}", headers=h)
    assert r.status_code == 200
    assert [x["id"] for x in r.json()["lines"]] == [ids[1]]
    assert r.json()["total_gbp"] == "10.00" and deleted == ["k0"]


def test_ac033_delete_failure_logged_and_only_line_409(client, world, db_session, monkeypatch):
    h = world["e1"]
    cid, ids = _draft(client, h)
    db_session.get(ClaimLine, ids[0]).receipt_key = "k0"
    db_session.commit()

    def boom(key):
        raise RuntimeError("x")

    monkeypatch.setattr(storage, "delete_object", boom)
    assert client.delete(f"/api/claims/{cid}/lines/{ids[0]}", headers=h).status_code == 200
    r = client.delete(f"/api/claims/{cid}/lines/{ids[1]}", headers=h)
    assert r.status_code == 409 and r.json()["detail"] == "A claim needs at least one line"
    assert db_session.query(ClaimLine).count() == 1


def test_ac034_non_draft_409_changes_nothing(client, world, db_session):
    h = world["e1"]
    cid, ids = _draft(client, h)
    db_session.get(Claim, cid).status = "pending_manager"
    db_session.commit()
    url = f"/api/claims/{cid}/lines/{ids[0]}"
    assert client.patch(url, json={"description": "n"}, headers=h).status_code == 409
    assert client.delete(url, headers=h).status_code == 409
    assert db_session.query(ClaimLine).count() == 2
    assert db_session.get(ClaimLine, ids[0]).description == "Taxi"


def test_ac035_ownership_403_404(client, world, db_session):
    cid, ids = _draft(client, world["e1"])
    url = f"/api/claims/{cid}/lines/{ids[0]}"
    assert client.patch(url, json={"description": "n"}, headers=world["e2"]).status_code == 404
    assert client.delete(url, headers=world["e2"]).status_code == 404
    assert client.patch(url, json={"description": "n"}, headers=world["m"]).status_code == 403
    assert client.delete(url, headers=world["m"]).status_code == 403
    assert client.delete(url).status_code == 401
    assert db_session.query(ClaimLine).count() == 2
    assert db_session.get(ClaimLine, ids[0]).description == "Taxi"


def test_line_of_other_claim_404_and_updated_at(client, world, db_session):
    h = world["e1"]
    cid, ids = _draft(client, h)
    other, oids = _draft(client, h, 1)
    assert client.delete(f"/api/claims/{cid}/lines/{oids[0]}", headers=h).status_code == 404
    before = db_session.get(Claim, cid).updated_at
    client.patch(f"/api/claims/{cid}/lines/{ids[0]}", json={"description": "n"}, headers=h)
    assert db_session.get(Claim, cid).updated_at > before
