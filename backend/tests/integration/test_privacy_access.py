"""[NFR-008] Personal data access is limited by role, checked through the API."""

import secrets

import pytest

from app.models import User
from app.security import hash_password
from app.services.categories import seed_categories


def _mk(db, pw, email, role):
    u = User(name=email, email=email, password_hash=hash_password(pw), role=role)
    db.add(u)
    db.commit()
    return u


@pytest.fixture
def people(client, db_session):
    seed_categories(db_session)
    pw = secrets.token_urlsafe(12)
    for n, role in (("e1", "Employee"), ("e2", "Employee"), ("f", "Finance")):
        _mk(db_session, pw, f"{n}@x.com", role)
    h = {}
    for n in ("e1", "e2", "f"):
        r = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {r.json()['token']}"}
    return h


def test_nfr008_employee_forbidden_from_users_and_queue(client, people):
    for path in ("/api/users", "/api/approvals/queue"):
        r = client.get(path, headers=people["e1"])
        assert r.status_code == 403, path
        assert r.json() == {"detail": "Forbidden"}
    assert client.get("/api/users", headers=people["f"]).status_code == 200


def test_nfr008_invisible_claim_is_404(client, people):
    cid = client.post("/api/claims", json={}, headers=people["e1"]).json()["id"]
    r = client.get(f"/api/claims/{cid}", headers=people["e2"])
    assert r.status_code == 404
    assert r.json() == {"detail": "Claim not found"}
    assert client.get(f"/api/claims/{cid}", headers=people["e1"]).status_code == 200


def test_nfr008_unauthenticated_gets_401(client, people):
    cid = client.post("/api/claims", json={}, headers=people["e1"]).json()["id"]
    for path in ("/api/users", "/api/approvals/queue", "/api/claims", f"/api/claims/{cid}"):
        r = client.get(path)
        assert r.status_code == 401, path
        assert r.json() == {"detail": "Not authenticated"}
