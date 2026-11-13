"""Rejected claims return to draft and can be resubmitted (US-018-1)."""

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

    def submitted(self, h):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        body = {
            "date": "2026-01-05",
            "category_id": self.cat,
            "amount_gbp": "5.00",
            "description": "t",
        }
        r = self.c.post(f"/api/claims/{cid}/lines", json=body, headers=h)
        lid = r.json()["lines"][0]["id"]
        u = self.c.put(
            f"/api/claims/{cid}/lines/{lid}/receipt",
            files={"file": ("r", PNG, "image/png")},
            headers=h,
        )
        assert u.status_code == 200, u.text
        assert self.c.post(f"/api/claims/{cid}/submit", headers=h).status_code == 200
        return cid, lid

    def decide(self, cid, h, decision, comment=None):
        return self.c.post(
            f"/api/claims/{cid}/decision",
            json={"decision": decision, "comment": comment},
            headers=h,
        )

    def get(self, cid, h):
        return self.c.get(f"/api/claims/{cid}", headers=h).json()

    def hist(self, cid, h):
        return self.c.get(f"/api/claims/{cid}/history", headers=h).json()


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    return W(client, db_session, tmp_path, monkeypatch)


def _edit_and_check(w, cid, lid, h, name, comment):
    got = w.get(cid, h)
    assert got["status"] == "draft"
    assert got["last_rejection"]["decided_by_name"] == name
    assert got["last_rejection"]["comment"] == comment
    r = w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "fixed"}, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["lines"][0]["description"] == "fixed"


def test_ac069_manager_reject_returns_editable_draft(w):
    mid, mh = w.user("Manager", name="Mia Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid, lid = w.submitted(eh)
    assert w.decide(cid, mh, "reject", "Fix it").status_code == 200
    _edit_and_check(w, cid, lid, eh, "Mia Manager", "Fix it")


def test_ac069_finance_reject_returns_editable_draft(w):
    _, eh = w.user("Employee")
    cid, lid = w.submitted(eh)
    _, f2 = w.user("Finance", name="Fay Finance")
    assert w.decide(cid, f2, "reject", "Wrong code").status_code == 200
    _edit_and_check(w, cid, lid, eh, "Fay Finance", "Wrong code")


def test_ac070_resubmit_after_manager_reject_goes_to_manager(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid, lid = w.submitted(eh)
    w.decide(cid, mh, "reject", "no")
    w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "v2"}, headers=eh)
    r = w.c.post(f"/api/claims/{cid}/submit", headers=eh)
    assert r.status_code == 200 and r.json()["status"] == "pending_manager"


def test_ac070_resubmit_after_finance_reject_restarts_at_manager(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid, lid = w.submitted(eh)
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.decide(cid, w.fin, "reject", "no").status_code == 200
    w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "v2"}, headers=eh)
    r = w.c.post(f"/api/claims/{cid}/submit", headers=eh)
    assert r.status_code == 200 and r.json()["status"] == "pending_manager"


def test_ac070_resubmit_without_manager_goes_to_finance(w):
    _, eh = w.user("Employee")
    cid, lid = w.submitted(eh)
    assert w.decide(cid, w.fin, "reject", "no").status_code == 200
    w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "v2"}, headers=eh)
    r = w.c.post(f"/api/claims/{cid}/submit", headers=eh)
    assert r.status_code == 200 and r.json()["status"] == "pending_finance"


def test_ac071_history_keeps_rejection_after_resubmit(w):
    mid, mh = w.user("Manager", name="Hana Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid, lid = w.submitted(eh)
    w.decide(cid, mh, "reject", "Receipt unclear")
    w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "v2"}, headers=eh)
    assert w.c.post(f"/api/claims/{cid}/submit", headers=eh).status_code == 200
    h = w.hist(cid, eh)
    assert [(e["old_status"], e["new_status"]) for e in h] == [
        ("draft", "pending_manager"),
        ("pending_manager", "draft"),
        ("draft", "pending_manager"),
    ]
    assert h[1]["comment"] == "Receipt unclear"
    assert h[1]["actor_name"] == "Hana Manager"
    times = [e["created_at"] for e in h]
    assert times == sorted(times)
    assert w.get(cid, eh)["last_rejection"] is None
