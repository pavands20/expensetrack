"""QA acceptance: receipts (US-011-3)."""

import secrets

import pytest

from app.models import Claim, ClaimLine, User
from app.security import hash_password
from app.services.categories import seed_categories

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20
MSG = "Receipts must be JPEG, PNG or PDF files of 5 MB or less."
FIVE_MB = 5 * 1024 * 1024


@pytest.fixture
def env(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    seed_categories(db_session)
    pw = secrets.token_urlsafe(12)
    for n in ("e1", "e2"):
        db_session.add(
            User(name=n, email=f"{n}@x.com", password_hash=hash_password(pw), role="Employee")
        )
    db_session.commit()
    h = {}
    for n in ("e1", "e2"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}
    cid = client.post("/api/claims", json={}, headers=h["e1"]).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "1.00", "description": "t"}
    lids = []
    for _ in range(2):
        r = client.post(f"/api/claims/{cid}/lines", json=body, headers=h["e1"])
        lids.append(r.json()["lines"][-1]["id"])
    return {"h": h, "cid": cid, "lids": lids, "tmp": tmp_path}


def _url(env, i=0, suffix="receipt"):
    return f"/api/claims/{env['cid']}/lines/{env['lids'][i]}/{suffix}"


def _put(client, env, data=PNG, ctype="image/png", i=0):
    return client.put(_url(env, i), files={"file": ("r", data, ctype)}, headers=env["h"]["e1"])


def test_ac040_txt_and_oversize_rejected_no_receipt(client, env):
    r = _put(client, env, b"hello", "text/plain")
    assert r.status_code == 415 and r.json()["detail"] == MSG
    r = _put(client, env, PNG + b"0" * (FIVE_MB - len(PNG) + 1))
    assert r.status_code == 413 and r.json()["detail"] == MSG
    c = client.get(f"/api/claims/{env['cid']}", headers=env["h"]["e1"]).json()
    assert all(ln["has_receipt"] is False for ln in c["lines"])


def test_nfr007_exact_5mb_passes_and_plus_one_fails(client, env):
    assert _put(client, env, PNG + b"0" * (FIVE_MB - len(PNG))).status_code == 200
    assert _put(client, env, PNG + b"0" * (FIVE_MB - len(PNG) + 1)).status_code == 413


def test_ac041_replacement_url_points_to_new_file(client, env):
    h = env["h"]["e1"]
    assert _put(client, env, PNG).status_code == 200
    u1 = client.get(_url(env, 0, "receipt-url"), headers=h).json()["url"]
    new = b"%PDF-1.4 new"
    r = _put(client, env, new, "application/pdf")
    assert r.status_code == 200 and r.json()["lines"][0]["has_receipt"] is True
    u2 = client.get(_url(env, 0, "receipt-url"), headers=h).json()
    assert u2["url"] != u1 and u2["expires_in"] <= 300
    assert client.get(u2["url"]).content == new
    c = client.get(f"/api/claims/{env['cid']}", headers=h).json()
    assert c["lines"][0]["has_receipt"] is True and c["lines"][1]["has_receipt"] is False


def test_ac042_locked_claim_409_upload_and_replace(client, env, db_session):
    assert _put(client, env).status_code == 200
    db_session.get(Claim, env["cid"]).status = "submitted"
    db_session.commit()
    assert _put(client, env).status_code == 409
    assert _put(client, env, i=1).status_code == 409
    assert db_session.get(ClaimLine, env["lids"][1]).receipt_key is None


def test_nfr006_invisible_claim_url_404_and_unauth_401(client, env):
    _put(client, env)
    assert client.get(_url(env, 0, "receipt-url"), headers=env["h"]["e2"]).status_code == 404
    assert client.get(_url(env, 0, "receipt-url")).status_code == 401
    assert client.get(_url(env, 1, "receipt-url"), headers=env["h"]["e1"]).status_code == 404
