"""QA acceptance: receipts only through short-lived private links (US-012)."""

import logging
import os
import secrets
from urllib.parse import parse_qs, urlparse

import httpx
import pytest

from app import storage
from app.models import User
from app.security import hash_password
from app.services.categories import seed_categories

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


def _mk(db, pw, email, role, manager_id=None):
    u = User(
        name=email,
        email=f"{secrets.token_hex(4)}-{email}",
        password_hash=hash_password(pw),
        role=role,
        manager_id=manager_id,
    )
    db.add(u)
    db.commit()
    return u


def _world(client, db_session):
    seed_categories(db_session)
    pw = secrets.token_urlsafe(12)
    mgr = _mk(db_session, pw, "m@x.com", "Manager")
    other_mgr = _mk(db_session, pw, "m2@x.com", "Manager")
    owner = _mk(db_session, pw, "o@x.com", "Employee", mgr.id)
    other = _mk(db_session, pw, "e@x.com", "Employee")
    fin = _mk(db_session, pw, "f@x.com", "Finance")
    h = {}
    users = (
        ("mgr", mgr),
        ("mgr2", other_mgr),
        ("owner", owner),
        ("other", other),
        ("fin", fin),
    )
    for n, u in users:
        r = client.post("/api/auth/login", json={"email": u.email, "password": pw})
        h[n] = {"Authorization": f"Bearer {r.json()['token']}"}
    cid = client.post("/api/claims", json={}, headers=h["owner"]).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "5.00", "description": "t"}
    r = client.post(f"/api/claims/{cid}/lines", json=body, headers=h["owner"])
    lid = r.json()["lines"][0]["id"]
    u = client.put(
        f"/api/claims/{cid}/lines/{lid}/receipt",
        files={"file": ("r", PNG, "image/png")},
        headers=h["owner"],
    )
    assert u.status_code == 200
    return {"h": h, "cid": cid, "url": f"/api/claims/{cid}/lines/{lid}/receipt-url"}


@pytest.fixture
def world(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return _world(client, db_session)


def test_ac044_owner_manager_finance_get_working_link(client, world):
    for who in ("owner", "mgr", "fin"):
        r = client.get(world["url"], headers=world["h"][who])
        assert r.status_code == 200, who
        assert r.json()["expires_in"] == 300
        assert set(r.json()) == {"url", "expires_in"}
        f = client.get(r.json()["url"])
        assert f.status_code == 200 and f.content == PNG


def test_ac045_expired_local_link_not_served(client, world, monkeypatch):
    url = client.get(world["url"], headers=world["h"]["owner"]).json()["url"]
    real = storage.time.time
    monkeypatch.setattr(storage.time, "time", lambda: real() + 301)
    r = client.get(url)
    assert r.status_code == 404
    assert PNG not in r.content


def test_ac046_unauthorised_users_get_404_and_unauth_401(client, world):
    for who in ("other", "mgr2"):
        r = client.get(world["url"], headers=world["h"][who])
        assert r.status_code == 404 and "url" not in r.json()
    assert client.get(world["url"]).status_code == 401


def test_ac047_direct_object_access_needs_valid_signature(client, world):
    url = client.get(world["url"], headers=world["h"]["owner"]).json()["url"]
    path = urlparse(url).path
    q = parse_qs(urlparse(url).query)
    exp, sig = q["exp"][0], q["sig"][0]
    bad_sig = ("0" if sig[0] != "0" else "1") + sig[1:]
    for qs in (
        "",
        f"?exp={exp}&sig=wrong",
        f"?exp={exp}&sig={bad_sig}",
        f"?exp={int(exp) + 1000}&sig={sig}",
        f"?sig={sig}",
    ):
        r = client.get(path + qs)
        assert r.status_code in (401, 403, 404), qs
        assert PNG not in r.content


def test_nfr006_nfr008_no_permanent_url_in_response_or_logs(client, world, caplog):
    caplog.set_level(logging.DEBUG)
    r = client.get(world["url"], headers=world["h"]["owner"])
    assert "amazonaws.com" not in r.text
    claim = client.get(f"/api/claims/{world['cid']}", headers=world["h"]["owner"])
    assert "amazonaws.com" not in claim.text and "receipts/" not in claim.text
    assert "amazonaws.com" not in caplog.text


@pytest.mark.skipif(not os.getenv("S3_BUCKET"), reason="S3_BUCKET unset")
def test_ac045_ac047_s3_presigned_short_and_bucket_private(client, db_session):
    w = _world(client, db_session)
    r = client.get(w["url"], headers=w["h"]["owner"])
    assert r.status_code == 200 and r.json()["expires_in"] == 300
    url = r.json()["url"]
    q = parse_qs(urlparse(url).query)
    assert "X-Amz-Expires" in q, f"presigned URL has no X-Amz-Expires: {sorted(q)}"
    assert int(q["X-Amz-Expires"][0]) <= 300
    assert httpx.get(url.split("?")[0]).status_code == 403


def test_ac047_storage_module_sets_no_public_acl():
    import inspect

    src = inspect.getsource(storage)
    assert "ACL" not in src and "public-read" not in src
