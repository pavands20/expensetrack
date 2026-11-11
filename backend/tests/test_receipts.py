"""Receipts: upload, replace, private short-lived links."""

import secrets
from unittest.mock import MagicMock

import pytest

from app import storage
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
    mgr = User(name="m", email="m@x.com", password_hash=hash_password(pw), role="Manager")
    db_session.add(mgr)
    db_session.commit()
    for e, m in (("e1@x.com", mgr.id), ("e2@x.com", None)):
        db_session.add(
            User(name=e, email=e, password_hash=hash_password(pw), role="Employee", manager_id=m)
        )
    db_session.commit()
    h = {}
    for n in ("m", "e1", "e2"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}
    cid = client.post("/api/claims", json={}, headers=h["e1"]).json()["id"]
    body = {"date": "2026-01-05", "category_id": 1, "amount_gbp": "1.00", "description": "t"}
    r = client.post(f"/api/claims/{cid}/lines", json=body, headers=h["e1"])
    lid = r.json()["lines"][0]["id"]
    return {"h": h, "url": f"/api/claims/{cid}/lines/{lid}/receipt", "cid": cid, "tmp": tmp_path}


def _put(client, env, data=PNG, ctype="image/png", who="e1"):
    return client.put(env["url"], files={"file": ("r", data, ctype)}, headers=env["h"][who])


def _files(env):
    return [p for p in env["tmp"].rglob("*") if p.is_file()]


def test_ac039_upload_sets_has_receipt(client, env):
    cases = (
        (PNG, "image/png"),
        (b"\xff\xd8\xff\xe0x", "image/jpeg"),
        (b"%PDF-1", "application/pdf"),
    )
    for data, ctype in cases:
        r = _put(client, env, data, ctype)
        assert r.status_code == 200 and r.json()["lines"][0]["has_receipt"] is True
    assert _put(client, env, PNG + b"0" * (FIVE_MB - len(PNG))).status_code == 200


def test_ac040_rejects_bad_files(client, env, db_session):
    r = _put(client, env, PNG + b"0" * FIVE_MB)
    assert r.status_code == 413 and r.json()["detail"] == MSG
    for data, ctype in ((PNG, "text/plain"), (b"GIF89a", "image/png"), (b"%PDF-", "image/png")):
        r = _put(client, env, data, ctype)
        assert r.status_code == 415 and r.json()["detail"] == MSG
    assert db_session.query(ClaimLine).one().receipt_key is None
    assert _files(env) == []


def test_ac041_replace_deletes_old(client, env, db_session, monkeypatch):
    _put(client, env)
    old = db_session.query(ClaimLine).one().receipt_key
    assert (env["tmp"] / old).exists()
    _put(client, env)
    new = db_session.query(ClaimLine).one().receipt_key
    assert new != old and not (env["tmp"] / old).exists() and (env["tmp"] / new).exists()
    assert new.startswith(f"receipts/{env['cid']}/") and new.endswith(".png")
    monkeypatch.setattr(storage, "delete_object", MagicMock(side_effect=RuntimeError("x")))
    assert _put(client, env).status_code == 200


def test_ac042_non_draft_conflict(client, env, db_session):
    db_session.get(Claim, env["cid"]).status = "submitted"
    db_session.commit()
    assert _put(client, env).status_code == 409
    assert db_session.query(ClaimLine).one().receipt_key is None
    assert _files(env) == []


def test_nfr004_put_owner_only(client, env):
    assert _put(client, env, who="e2").status_code == 404
    assert _put(client, env, who="m").status_code == 403
    assert client.put(env["url"], files={"file": ("r", PNG, "image/png")}).status_code == 401


def test_nfr006_local_signed_link(client, env):
    u = env["url"] + "-url"
    assert client.get(u, headers=env["h"]["e1"]).status_code == 404
    _put(client, env)
    assert client.get(u, headers=env["h"]["e2"]).status_code == 404
    r = client.get(u, headers=env["h"]["m"])
    assert r.status_code == 200 and r.json()["expires_in"] <= 300
    link = r.json()["url"]
    got = client.get(link)
    assert got.status_code == 200 and got.content == PNG
    assert client.get(link[:-1] + ("0" if link[-1] != "0" else "1")).status_code == 404
    assert client.get(link.split("?")[0]).status_code == 404


def test_nfr006_s3_branch(monkeypatch):
    fake = MagicMock()
    fake.generate_presigned_url.return_value = "https://s3/signed"
    monkeypatch.setenv("S3_BUCKET", "b")
    monkeypatch.setattr("boto3.client", lambda *a, **k: fake)
    storage.put_object("receipts/1/2/a.png", b"x", "image/png")
    assert fake.put_object.call_args.kwargs["Bucket"] == "b"
    assert storage.presign_get("receipts/1/2/a.png") == ("https://s3/signed", 300)
    assert fake.generate_presigned_url.call_args.kwargs["ExpiresIn"] == 300
    storage.delete_object("k")
    assert fake.delete_object.call_args.kwargs == {"Bucket": "b", "Key": "k"}
