"""Role-based claim listing and visibility."""

import secrets

import pytest

from app.models import User
from app.security import hash_password


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


@pytest.fixture
def world(client, db_session, pw):
    boss = _mk(db_session, pw, "boss@x.com", "Manager")
    m = _mk(db_session, pw, "m@x.com", "Manager", boss.id)
    peer = _mk(db_session, pw, "peer@x.com", "Manager", boss.id)
    _mk(db_session, pw, "r@x.com", "Employee", m.id)
    _mk(db_session, pw, "gone@x.com", "Employee", m.id)
    _mk(db_session, pw, "o@x.com", "Employee", peer.id)
    _mk(db_session, pw, "f@x.com", "Finance")
    h, ids = {}, {}
    for n in ("boss", "m", "peer", "r", "gone", "o", "f"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}
        ids[n] = client.post("/api/claims", json={}, headers=h[n]).json()["id"]
    db_session.query(User).filter_by(email="gone@x.com").one().is_active = False
    db_session.commit()
    return h, ids


def _list(client, h):
    return [c["id"] for c in client.get("/api/claims", headers=h).json()]


def test_ac013_employee_sees_only_own(client, world):
    h, ids = world
    assert _list(client, h["r"]) == [ids["r"]]
    assert client.get(f"/api/claims/{ids['o']}", headers=h["r"]).status_code == 404


def test_ac014_manager_sees_own_and_reports(client, world):
    h, ids = world
    assert _list(client, h["m"]) == sorted([ids["m"], ids["r"], ids["gone"]], reverse=True)


def test_ac015_finance_sees_all_including_inactive(client, world):
    h, ids = world
    assert _list(client, h["f"]) == sorted(ids.values(), reverse=True)
    assert ids["gone"] in _list(client, h["f"])


def test_ac016_manager_by_id_non_report_404(client, world):
    h, ids = world
    for other in ("boss", "peer", "o"):
        assert client.get(f"/api/claims/{ids[other]}", headers=h["m"]).status_code == 404
    assert client.get(f"/api/claims/{ids['gone']}", headers=h["m"]).status_code == 200


def test_nfr004_list_requires_auth(client, world):
    assert client.get("/api/claims").status_code == 401
