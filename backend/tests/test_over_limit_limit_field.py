"""Line category limit exposed next to the over_limit flag."""

import secrets
import uuid

import pytest

from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


@pytest.fixture
def world(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    pw = secrets.token_urlsafe(12)

    def login(email):
        r = client.post("/api/auth/login", json={"email": email, "password": pw})
        return {"Authorization": f"Bearer {r.json()['token']}"}

    email = f"f-{uuid.uuid4().hex[:8]}@example.com"
    db_session.add(User(name="F", email=email, password_hash=hash_password(pw), role="Finance"))
    db_session.commit()
    fin = login(email)
    r = client.post(
        "/api/users",
        json={
            "name": "E",
            "email": f"e-{uuid.uuid4().hex[:8]}@example.com",
            "role": "Employee",
            "initial_password": pw,
        },
        headers=fin,
    )
    emp = login(r.json()["email"])
    limited = client.post(
        "/api/categories", json={"name": "Lim", "limit_gbp": "50"}, headers=fin
    ).json()["id"]
    free = client.post("/api/categories", json={"name": "Free"}, headers=fin).json()["id"]
    return client, fin, emp, limited, free


def _claim(client, h, cat, amount):
    cid = client.post("/api/claims", json={}, headers=h).json()["id"]
    r = client.post(
        f"/api/claims/{cid}/lines",
        json={"date": "2026-01-05", "category_id": cat, "amount_gbp": amount, "description": "t"},
        headers=h,
    )
    assert r.status_code == 201, r.text
    return cid, r


def test_ac077_limit_field_on_mutation_get_list_and_queue(world):
    client, fin, emp, limited, free = world
    cid, r = _claim(client, emp, limited, "60.00")
    line = r.json()["lines"][0]
    assert line["category_limit_gbp"] == "50.00" and line["over_limit"] is True
    assert (
        client.get(f"/api/claims/{cid}", headers=emp).json()["lines"][0]["category_limit_gbp"]
        == "50.00"
    )
    assert (
        client.get("/api/claims", headers=emp).json()[0]["lines"][0]["category_limit_gbp"]
        == "50.00"
    )
    lid = line["id"]
    client.put(
        f"/api/claims/{cid}/lines/{lid}/receipt",
        files={"file": ("r", PNG, "image/png")},
        headers=emp,
    )
    assert client.post(f"/api/claims/{cid}/submit", headers=emp).status_code == 200
    q = client.get("/api/approvals/queue", headers=fin).json()
    assert q[0]["lines"][0]["category_limit_gbp"] == "50.00"
    assert q[0]["lines"][0]["over_limit"] is True


def test_ac077_null_when_no_limit(world):
    client, _, emp, _, free = world
    _, r = _claim(client, emp, free, "999.00")
    line = r.json()["lines"][0]
    assert line["category_limit_gbp"] is None and line["over_limit"] is False


def test_ac078_equal_to_limit_is_not_over(world):
    client, _, emp, limited, _ = world
    _, r = _claim(client, emp, limited, "50.00")
    line = r.json()["lines"][0]
    assert line["over_limit"] is False and line["category_limit_gbp"] == "50.00"
    _, r = _claim(client, emp, limited, "50.01")
    assert r.json()["lines"][0]["over_limit"] is True


def test_ac079_submit_with_over_limit_line_succeeds(world):
    client, _, emp, limited, _ = world
    cid, r = _claim(client, emp, limited, "75.00")
    lid = r.json()["lines"][0]["id"]
    client.put(
        f"/api/claims/{cid}/lines/{lid}/receipt",
        files={"file": ("r", PNG, "image/png")},
        headers=emp,
    )
    s = client.post(f"/api/claims/{cid}/submit", headers=emp)
    assert s.status_code == 200
    assert s.json()["lines"][0]["over_limit"] is True
