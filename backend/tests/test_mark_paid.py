"""Mark an approved claim as paid (US-016-1)."""

import secrets
import uuid

import pytest

from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


class W:
    def __init__(self, client, db, tmp_path, monkeypatch):
        monkeypatch.delenv("S3_BUCKET", raising=False)
        monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
        self.c = client
        self.pw = secrets.token_urlsafe(12)
        email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
        # Stands in for the bootstrap seed, which lifespan would run but tests do not.
        db.add(
            User(
                name="Finance One",
                email=email,
                password_hash=hash_password(self.pw),
                role="Finance",
            )
        )
        db.commit()
        self.fin = self.login(email)
        r = self.c.post(
            "/api/categories", json={"name": f"C-{uuid.uuid4().hex[:8]}"}, headers=self.fin
        )
        self.cat = r.json()["id"]

    def login(self, email):
        r = self.c.post("/api/auth/login", json={"email": email, "password": self.pw})
        return {"Authorization": f"Bearer {r.json()['token']}"}

    def user(self, role, name=None, manager_id=None):
        email = f"u-{uuid.uuid4().hex[:10]}@example.com"
        r = self.c.post(
            "/api/users",
            json={
                "name": name or f"N {uuid.uuid4().hex[:6]}",
                "email": email,
                "role": role,
                "manager_id": manager_id,
                "initial_password": self.pw,
            },
            headers=self.fin,
        )
        assert r.status_code == 201, r.text
        return r.json()["id"], self.login(email)

    def claim(self, h, upto="approved", approver=None):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        if upto == "draft":
            return cid
        body = {
            "date": "2026-01-05",
            "category_id": self.cat,
            "amount_gbp": "5.00",
            "description": "t",
        }
        r = self.c.post(f"/api/claims/{cid}/lines", json=body, headers=h)
        lid = r.json()["lines"][0]["id"]
        self.c.put(
            f"/api/claims/{cid}/lines/{lid}/receipt",
            files={"file": ("r", PNG, "image/png")},
            headers=h,
        )
        assert self.c.post(f"/api/claims/{cid}/submit", headers=h).status_code == 200
        if upto == "approved":
            r = self.c.post(
                f"/api/claims/{cid}/decision",
                json={"decision": "approve"},
                headers=approver or self.fin,
            )
            assert r.status_code == 200, r.text
        return cid

    def status(self, cid):
        return self.c.get(f"/api/claims/{cid}", headers=self.fin).json()["status"]

    def pay(self, cid, h=None):
        return self.c.post(f"/api/claims/{cid}/mark-paid", headers=h or self.fin)


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    return W(client, db_session, tmp_path, monkeypatch)


def test_ac062_finance_marks_paid_and_history_records_actor(w):
    _, eh = w.user("Employee")
    cid = w.claim(eh)
    _, f2 = w.user("Finance", name="Pat Payer")
    r = w.pay(cid, f2)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "paid"
    last = w.c.get(f"/api/claims/{cid}/history", headers=eh).json()[-1]
    assert (last["old_status"], last["new_status"]) == ("approved", "paid")
    assert last["actor_name"] == "Pat Payer"
    assert last["created_at"].endswith("+00:00")


@pytest.mark.parametrize("upto", ["draft", "pending_finance", "paid"])
def test_ac063_not_approved_is_409(w, upto):
    _, eh = w.user("Employee")
    if upto == "paid":
        cid = w.claim(eh)
        assert w.pay(cid).status_code == 200
    else:
        cid = w.claim(eh, upto=upto)
    before = w.status(cid)
    r = w.pay(cid)
    assert r.status_code == 409
    assert r.json() == {"detail": "Claim is not awaiting payment"}
    assert w.status(cid) == before


def test_ac064_non_finance_forbidden_invisible_404_unauth_401(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid = w.claim(eh, approver=None, upto="pending_finance")
    w.c.post(f"/api/claims/{cid}/decision", json={"decision": "approve"}, headers=mh)
    w.c.post(f"/api/claims/{cid}/decision", json={"decision": "approve"}, headers=w.fin)
    assert w.status(cid) == "approved"
    for h in (eh, mh):
        r = w.pay(cid, h)
        assert r.status_code == 403 and r.json() == {"detail": "Forbidden"}
    _, other = w.user("Employee")
    r = w.pay(cid, other)
    assert r.status_code == 404 and r.json() == {"detail": "Claim not found"}
    assert w.c.post(f"/api/claims/{cid}/mark-paid").status_code == 401
    assert w.status(cid) == "approved"


def test_ac065_submitter_cannot_mark_own_paid(w):
    _, f2 = w.user("Finance")
    cid = w.claim(w.fin, approver=f2)
    assert w.status(cid) == "approved"
    r = w.pay(cid, w.fin)
    assert r.status_code == 403
    assert w.status(cid) == "approved"
