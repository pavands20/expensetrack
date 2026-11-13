"""QA acceptance: rejected claim returns to the employee and is resubmitted (US-018)."""

import secrets
import uuid

import pytest

from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


class W:
    def __init__(self, client, db_session):
        self.c = client
        self.pw = secrets.token_urlsafe(12)
        email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
        db_session.add(
            User(
                name="Finance One",
                email=email,
                password_hash=hash_password(self.pw),
                role="Finance",
            )
        )
        db_session.commit()
        self.fin = self.login(email)
        r = self.c.post(
            "/api/categories", json={"name": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=self.fin
        )
        assert r.status_code == 201, r.text
        self.cat = r.json()["id"]

    def login(self, email):
        r = self.c.post("/api/auth/login", json={"email": email, "password": self.pw})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['token']}"}

    def user(self, role, manager_id=None, name=None):
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

    def claim(self, h):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        r = self.c.post(
            f"/api/claims/{cid}/lines",
            json={
                "date": "2026-01-05",
                "category_id": self.cat,
                "amount_gbp": "5.00",
                "description": "t",
            },
            headers=h,
        )
        assert r.status_code == 201, r.text
        lid = r.json()["lines"][-1]["id"]
        u = self.c.put(
            f"/api/claims/{cid}/lines/{lid}/receipt",
            files={"file": ("r", PNG, "image/png")},
            headers=h,
        )
        assert u.status_code == 200, u.text
        return cid, lid

    def submit(self, cid, h):
        return self.c.post(f"/api/claims/{cid}/submit", headers=h)

    def decide(self, cid, h, decision, comment=None):
        body = {"decision": decision}
        if comment is not None:
            body["comment"] = comment
        return self.c.post(f"/api/claims/{cid}/decision", json=body, headers=h)

    def get(self, cid, h):
        return self.c.get(f"/api/claims/{cid}", headers=h).json()

    def hist(self, cid, h):
        r = self.c.get(f"/api/claims/{cid}/history", headers=h)
        assert r.status_code == 200, r.text
        return r.json()


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return W(client, db_session)


def test_ac069_manager_rejected_is_editable_draft_with_name_and_comment(w):
    mid, mh = w.user("Manager", name="Rita Reject")
    _, eh = w.user("Employee", manager_id=mid)
    cid, lid = w.claim(eh)
    assert w.submit(cid, eh).status_code == 200
    assert w.decide(cid, mh, "reject", "Receipt unclear").status_code == 200
    got = w.get(cid, eh)
    assert got["status"] == "draft"
    assert got["last_rejection"]["comment"] == "Receipt unclear"
    assert got["last_rejection"]["decided_by_name"] == "Rita Reject"
    r = w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "fixed"}, headers=eh)
    assert r.status_code == 200, r.text
    assert w.get(cid, eh)["lines"][0]["description"] == "fixed"


def test_ac069_finance_rejected_is_editable_draft_with_name_and_comment(w):
    _, eh = w.user("Employee")
    cid, lid = w.claim(eh)
    assert w.submit(cid, eh).status_code == 200
    assert w.decide(cid, w.fin, "reject", "Wrong category").status_code == 200
    got = w.get(cid, eh)
    assert got["status"] == "draft"
    assert got["last_rejection"]["comment"] == "Wrong category"
    assert got["last_rejection"]["decided_by_name"] == "Finance One"
    r = w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"amount_gbp": "7.50"}, headers=eh)
    assert r.status_code == 200, r.text
    assert w.get(cid, eh)["total_gbp"] == "7.50"


def test_ac070_resubmit_after_manager_rejection_restarts_at_manager(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid, lid = w.claim(eh)
    w.submit(cid, eh)
    w.decide(cid, mh, "reject", "fix it")
    w.c.patch(f"/api/claims/{cid}/lines/{lid}", json={"description": "v2"}, headers=eh)
    r = w.submit(cid, eh)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "pending_manager"
    assert cid in [c["id"] for c in w.c.get("/api/approvals/queue", headers=mh).json()]


def test_ac070_resubmit_after_finance_rejection_restarts_from_manager_stage(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid, _ = w.claim(eh)
    w.submit(cid, eh)
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.decide(cid, w.fin, "reject", "back").status_code == 200
    assert w.get(cid, eh)["status"] == "draft"
    r = w.submit(cid, eh)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "pending_manager"
    # the manager can decide again
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.get(cid, eh)["status"] == "pending_finance"


def test_ac070_no_manager_resubmit_goes_to_finance(w):
    _, eh = w.user("Employee")
    cid, _ = w.claim(eh)
    w.submit(cid, eh)
    w.decide(cid, w.fin, "reject", "no")
    r = w.submit(cid, eh)
    assert r.status_code == 200
    assert r.json()["status"] == "pending_finance"


def test_ac070_resubmit_uses_current_manager_after_change(w):
    m1, h1 = w.user("Manager")
    m2, h2 = w.user("Manager")
    eid, eh = w.user("Employee", manager_id=m1)
    cid, _ = w.claim(eh)
    w.submit(cid, eh)
    w.decide(cid, h1, "reject", "x")
    p = w.c.patch(f"/api/users/{eid}", json={"manager_id": m2}, headers=w.fin)
    assert p.status_code == 200, p.text
    assert w.submit(cid, eh).json()["status"] == "pending_manager"
    ids2 = [c["id"] for c in w.c.get("/api/approvals/queue", headers=h2).json()]
    ids1 = [c["id"] for c in w.c.get("/api/approvals/queue", headers=h1).json()]
    assert cid in ids2 and cid not in ids1


def test_ac071_rejection_and_comment_stay_in_history_after_resubmit(w):
    mid, mh = w.user("Manager", name="Hist Mgr")
    _, eh = w.user("Employee", manager_id=mid)
    cid, _ = w.claim(eh)
    w.submit(cid, eh)
    w.decide(cid, mh, "reject", "Needs detail")
    w.submit(cid, eh)
    for h in (eh, mh, w.fin):
        rows = w.hist(cid, h)
        pairs = [(e["old_status"], e["new_status"]) for e in rows]
        assert pairs == [
            ("draft", "pending_manager"),
            ("pending_manager", "draft"),
            ("draft", "pending_manager"),
        ]
        assert rows[1]["comment"] == "Needs detail"
        assert rows[1]["actor_name"] == "Hist Mgr"
    # a second rejection round keeps both comments
    w.decide(cid, mh, "approve")
    w.decide(cid, w.fin, "reject", "Second round")
    comments = [e["comment"] for e in w.hist(cid, eh) if e["comment"]]
    assert comments == ["Needs detail", "Second round"]


def test_nfr008_ac069_ac071_rejected_claim_and_history_hidden_from_others(w):
    _, eh = w.user("Employee")
    _, oh = w.user("Employee")
    cid, _ = w.claim(eh)
    w.submit(cid, eh)
    w.decide(cid, w.fin, "reject", "private note")
    assert w.c.get(f"/api/claims/{cid}", headers=oh).status_code == 404
    assert w.c.get(f"/api/claims/{cid}/history", headers=oh).status_code == 404
    assert w.c.get(f"/api/claims/{cid}").status_code == 401
