"""QA acceptance: role-based claim visibility (US-004-2), built through the API."""

import secrets

import pytest

from app.models import User
from app.security import hash_password


@pytest.fixture
def world(client, db_session):
    pw = secrets.token_urlsafe(12)
    db_session.add(
        User(name="F", email="fin@x.com", password_hash=hash_password(pw), role="Finance")
    )
    db_session.commit()

    def login(email):
        r = client.post("/api/auth/login", json={"email": email, "password": pw})
        return {"Authorization": f"Bearer {r.json()['token']}"}

    fin = login("fin@x.com")

    def mk(n, role, mid=None):
        body = {
            "name": n,
            "email": f"{n}@x.com",
            "role": role,
            "manager_id": mid,
            "initial_password": pw,
        }
        r = client.post("/api/users", json=body, headers=fin)
        assert r.status_code == 201, r.text
        return r.json()["id"]

    mgr = mk("mgr", "Manager")
    peer = mk("peer", "Manager")
    uid = {
        "mgr": mgr,
        "peer": peer,
        "rep": mk("rep", "Employee", mgr),
        "gone": mk("gone", "Employee", peer),
        "other": mk("other", "Employee", peer),
    }
    h, cl = {"fin": fin}, {}
    for n in uid:
        h[n] = login(f"{n}@x.com")
        cl[n] = client.post("/api/claims", json={"title": n}, headers=h[n]).json()["id"]
    r = client.post(f"/api/users/{uid['gone']}/deactivate", headers=fin)
    assert r.status_code == 200
    return h, cl


def _ids(client, h):
    r = client.get("/api/claims", headers=h)
    assert r.status_code == 200
    return [c["id"] for c in r.json()]


def test_ac013_employee_own_only_and_404_other(client, world):
    h, cl = world
    assert _ids(client, h["other"]) == [cl["other"]]
    assert client.get(f"/api/claims/{cl['rep']}", headers=h["other"]).status_code == 404
    assert client.get(f"/api/claims/{cl['other']}", headers=h["other"]).status_code == 200


def test_ac014_manager_own_and_report_only(client, world):
    h, cl = world
    got = _ids(client, h["mgr"])
    assert sorted(got) == sorted([cl["mgr"], cl["rep"]])
    assert got == sorted(got, reverse=True)
    assert cl["other"] not in got and cl["peer"] not in got and cl["gone"] not in got


def test_ac015_finance_all_including_deactivated(client, world):
    h, cl = world
    got = _ids(client, h["fin"])
    assert set(cl.values()) <= set(got)
    assert cl["gone"] in got


def test_ac016_manager_non_report_404_reveals_nothing(client, world):
    h, cl = world
    missing = client.get("/api/claims/99999", headers=h["mgr"])
    for k in ("peer", "other", "gone"):
        r = client.get(f"/api/claims/{cl[k]}", headers=h["mgr"])
        assert r.status_code == 404
        assert r.json() == missing.json()
        assert k not in r.text.replace("Claim not found", "")


def test_ac013_unauthenticated_401(client, world):
    _, cl = world
    assert client.get("/api/claims").status_code == 401
    assert client.get(f"/api/claims/{cl['rep']}").status_code == 401


def test_nfr004_employee_cannot_use_finance_endpoints(client, world):
    h, _ = world
    assert client.get("/api/users", headers=h["rep"]).status_code == 403
    assert client.get("/api/users", headers=h["mgr"]).status_code == 403
