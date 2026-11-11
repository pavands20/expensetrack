"""Draft claims: create, lines, read, delete, visibility."""

import secrets

import pytest

from app import storage
from app.models import Claim, ClaimLine, User
from app.security import hash_password
from app.services.categories import seed_categories


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


@pytest.fixture
def cats(db_session):
    seed_categories(db_session)


def _mk(db, pw, email, role, manager_id=None):
    u = User(
        name=email, email=email, password_hash=hash_password(pw), role=role, manager_id=manager_id
    )
    db.add(u)
    db.commit()
    return u


def _hdr(client, pw, email):
    t = client.post("/api/auth/login", json={"email": email, "password": pw}).json()["token"]
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture
def world(client, db_session, pw, cats):
    mgr = _mk(db_session, pw, "m@x.com", "Manager")
    _mk(db_session, pw, "e1@x.com", "Employee", mgr.id)
    _mk(db_session, pw, "e2@x.com", "Employee")
    _mk(db_session, pw, "f@x.com", "Finance")
    return {n: _hdr(client, pw, f"{n}@x.com") for n in ("m", "e1", "e2", "f")}


def _line(**kw):
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "48.50", "description": "Taxi"}
    body.update(kw)
    return body


def _claim(client, h):
    return client.post("/api/claims", json={}, headers=h).json()["id"]


def test_ac028_create_and_add_line(client, world):
    h = world["e1"]
    r = client.post("/api/claims", json={"title": "Trip"}, headers=h)
    assert r.status_code == 201
    c = r.json()
    assert c["status"] == "draft" and c["lines"] == [] and c["total_gbp"] == "0.00"
    assert c["reference"] == f"EXP-{c['id']:04d}" and c["owner_name"] == "e1@x.com"
    r = client.post(f"/api/claims/{c['id']}/lines", json=_line(), headers=h)
    assert r.status_code == 201
    ln = r.json()["lines"][0]
    assert ln["amount_gbp"] == "48.50" and ln["category_name"] == "Travel"
    assert ln["date"] == "2026-01-05" and ln["description"] == "Taxi"
    assert client.post("/api/claims", json={}).status_code == 401
    assert client.post("/api/claims", json={"title": "x" * 81}, headers=h).status_code == 422


def test_ac029_invalid_lines(client, world, db_session):
    h = world["e1"]
    cid = _claim(client, h)
    url = f"/api/claims/{cid}/lines"
    for f in ("date", "category_id", "amount_gbp", "description"):
        body = _line()
        del body[f]
        r = client.post(url, json=body, headers=h)
        assert r.status_code == 422
        assert ["body", f] in [e["loc"] for e in r.json()["detail"]]
    for bad in (0, -1, "abc", "1.234", "100000000.00"):
        r = client.post(url, json=_line(amount_gbp=bad), headers=h)
        assert r.status_code == 422
        assert ["body", "amount_gbp"] in [e["loc"] for e in r.json()["detail"]]
    assert client.post(url, json=_line(description="  "), headers=h).status_code == 422
    r = client.post(url, json=_line(category_id=999), headers=h)
    assert r.status_code == 422 and r.json()["detail"][0]["loc"] == ["body", "category_id"]
    assert db_session.query(ClaimLine).count() == 0
    for ok in ("0.01", "99999999.99", 12.5):
        assert client.post(url, json=_line(amount_gbp=ok), headers=h).status_code == 201


def test_ac030_total_is_exact_sum(client, world):
    h = world["e1"]
    cid = _claim(client, h)
    for amt, d in (("48.50", "2026-01-03"), ("22.00", "2026-01-01"), ("14.00", "2026-01-02")):
        client.post(f"/api/claims/{cid}/lines", json=_line(amount_gbp=amt, date=d), headers=h)
    c = client.get(f"/api/claims/{cid}", headers=h).json()
    assert c["total_gbp"] == "84.50"
    assert [ln["date"] for ln in c["lines"]] == ["2026-01-01", "2026-01-02", "2026-01-03"]


def test_ac031_retired_category(client, world):
    h = world["e1"]
    cid = _claim(client, h)
    client.post(f"/api/claims/{cid}/lines", json=_line(category_id=2), headers=h)
    client.patch("/api/categories/2", json={"is_active": False}, headers=world["f"])
    r = client.post(f"/api/claims/{cid}/lines", json=_line(category_id=2), headers=h)
    assert r.status_code == 422 and r.json()["detail"][0]["loc"] == ["body", "category_id"]
    ln = client.get(f"/api/claims/{cid}", headers=h).json()["lines"][0]
    assert ln["category_name"] == "Meals" and ln["category_is_active"] is False


def test_ac036_delete_draft_removes_receipts(client, world, db_session, monkeypatch):
    h = world["e1"]
    cid = _claim(client, h)
    client.post(f"/api/claims/{cid}/lines", json=_line(), headers=h)
    client.post(f"/api/claims/{cid}/lines", json=_line(), headers=h)
    for i, ln in enumerate(db_session.query(ClaimLine).all()):
        ln.receipt_key = f"k{i}"
    db_session.commit()
    deleted = []

    def fake(key):
        deleted.append(key)
        if key == "k0":
            raise RuntimeError("boom")

    monkeypatch.setattr(storage, "delete_object", fake)
    assert client.delete(f"/api/claims/{cid}", headers=h).status_code == 204
    assert sorted(deleted) == ["k0", "k1"]
    assert db_session.query(ClaimLine).count() == 0
    assert client.get(f"/api/claims/{cid}", headers=h).status_code == 404


def test_ac036_local_storage_delete(tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    (tmp_path / "r.png").write_bytes(b"x")
    storage.delete_object("r.png")
    assert not (tmp_path / "r.png").exists()
    storage.delete_object("r.png")
    with pytest.raises(ValueError):
        storage.delete_object("../evil")


def test_ac037_non_draft_conflicts(client, world, db_session):
    h = world["e1"]
    cid = _claim(client, h)
    db_session.get(Claim, cid).status = "submitted"
    db_session.commit()
    r = client.delete(f"/api/claims/{cid}", headers=h)
    assert r.status_code == 409 and r.json()["detail"] == "Only draft claims can be deleted"
    assert client.post(f"/api/claims/{cid}/lines", json=_line(), headers=h).status_code == 409
    assert client.get(f"/api/claims/{cid}", headers=h).status_code == 200


def test_ac038_not_deleting_keeps_claim(client, world):
    h = world["e1"]
    cid = _claim(client, h)
    client.post(f"/api/claims/{cid}/lines", json=_line(), headers=h)
    client.get(f"/api/claims/{cid}", headers=h)
    c = client.get(f"/api/claims/{cid}", headers=h).json()
    assert len(c["lines"]) == 1


def test_nfr004_visibility(client, world):
    cid = _claim(client, world["e1"])
    url = f"/api/claims/{cid}"
    assert client.get(url, headers=world["e2"]).status_code == 404
    assert client.post(f"{url}/lines", json=_line(), headers=world["e2"]).status_code == 404
    assert client.delete(url, headers=world["e2"]).status_code == 404
    for who in ("m", "f"):
        assert client.get(url, headers=world[who]).status_code == 200
        assert client.post(f"{url}/lines", json=_line(), headers=world[who]).status_code == 403
        assert client.delete(url, headers=world[who]).status_code == 403
    assert client.get(url).status_code == 401
    assert client.get("/api/claims/9999", headers=world["f"]).status_code == 404
    # a manager does not see a non-report's claim
    other = _claim(client, world["e2"])
    assert client.get(f"/api/claims/{other}", headers=world["m"]).status_code == 404
