"""Categories: seeding and Finance-managed API."""

import secrets

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models import Category, User
from app.security import hash_password
from app.services.categories import seed_categories


@pytest.fixture
def pw():
    return secrets.token_urlsafe(12)


def _mk(db, pw, email, role):
    db.add(User(name=role, email=email, password_hash=hash_password(pw), role=role))
    db.commit()


def _hdr(client, pw, email):
    t = client.post("/api/auth/login", json={"email": email, "password": pw}).json()["token"]
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture
def fin(client, db_session, pw):
    _mk(db_session, pw, "f@x.com", "Finance")
    return _hdr(client, pw, "f@x.com")


@pytest.fixture
def emp(client, db_session, pw):
    _mk(db_session, pw, "e@x.com", "Employee")
    return _hdr(client, pw, "e@x.com")


def test_ac072_seed_and_idempotent(db_session):
    seed_categories(db_session)
    rows = list(db_session.scalars(select(Category).order_by(Category.id)))
    assert [r.name for r in rows] == ["Travel", "Meals", "Equipment", "Other"]
    assert all(r.is_active and r.limit_gbp is None for r in rows)
    rows[0].name = "Trips"
    rows[1].is_active = False
    db_session.commit()
    seed_categories(db_session)
    got = {r.name: r.is_active for r in db_session.scalars(select(Category))}
    assert got == {"Trips": True, "Meals": False, "Equipment": True, "Other": True}


def test_ac072_lifespan_calls_seed():
    import inspect

    from app import main

    src = inspect.getsource(main.lifespan)
    assert src.index("_seed_admin()") < src.index("seed_categories()")


def test_ac073_limit_set_clear_and_invalid(client, fin):
    c = client.post("/api/categories", json={"name": "Travel"}, headers=fin).json()
    assert c["limit_gbp"] is None
    url = f"/api/categories/{c['id']}"
    r = client.patch(url, json={"limit_gbp": "150"}, headers=fin)
    assert r.status_code == 200 and r.json()["limit_gbp"] == "150.00"
    assert client.patch(url, json={"limit_gbp": 12.5}, headers=fin).json()["limit_gbp"] == "12.50"
    for bad in (0, -1, "abc", "1.234"):
        assert client.patch(url, json={"limit_gbp": bad}, headers=fin).status_code == 422
    r = client.patch(url, json={"limit_gbp": None}, headers=fin)
    assert r.json()["limit_gbp"] is None
    r = client.post("/api/categories", json={"name": "X", "limit_gbp": 0}, headers=fin)
    assert r.status_code == 422 and r.json()["detail"][0]["loc"][0] == "body"


def test_ac074_retire_and_listing(client, fin, emp, db_session):
    seed_categories(db_session)
    cid = client.get("/api/categories", headers=fin).json()[0]["id"]
    r = client.patch(f"/api/categories/{cid}", json={"is_active": False}, headers=fin)
    assert r.json()["is_active"] is False
    assert len(client.get("/api/categories", headers=fin).json()) == 3
    assert len(client.get("/api/categories?include_retired=true", headers=fin).json()) == 4
    assert len(client.get("/api/categories?include_retired=true", headers=emp).json()) == 3
    assert db_session.get(Category, cid) is not None


def test_ac075_roles(client, fin, emp):
    assert client.get("/api/categories").status_code == 401
    assert client.post("/api/categories", json={"name": "A"}).status_code == 401
    assert client.patch("/api/categories/1", json={}).status_code == 401
    assert client.post("/api/categories", json={"name": "A"}, headers=emp).status_code == 403
    assert client.patch("/api/categories/1", json={}, headers=emp).status_code == 403
    assert client.get("/api/categories", headers=emp).status_code == 200
    assert client.patch("/api/categories/99", json={}, headers=fin).status_code == 404


def test_ac076_duplicate_names(client, fin):
    a = client.post("/api/categories", json={"name": " Travel "}, headers=fin)
    assert a.status_code == 201 and a.json()["name"] == "Travel"
    d = client.post("/api/categories", json={"name": "TRAVEL"}, headers=fin)
    assert d.status_code == 409
    assert d.json()["detail"] == "A category with that name already exists"
    b = client.post("/api/categories", json={"name": "Meals"}, headers=fin).json()
    r = client.patch(f"/api/categories/{b['id']}", json={"name": "travel "}, headers=fin)
    assert r.status_code == 409
    names = [c["name"] for c in client.get("/api/categories", headers=fin).json()]
    assert names == ["Meals", "Travel"]
    same = client.patch(f"/api/categories/{b['id']}", json={"name": "MEALS"}, headers=fin)
    assert same.status_code == 200


def test_ac076_unique_index_enforced(db_session):
    db_session.add(Category(name="A"))
    db_session.commit()
    db_session.add(Category(name="a"))
    with pytest.raises(IntegrityError):
        db_session.commit()
