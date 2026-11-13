"""QA acceptance: approval flow, self-approval prevention, audit trail (US-014), via the API."""

import secrets
import uuid

import pytest

from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


class W:
    """Per-test world: every user, category and claim is created through the API."""

    def __init__(self, client, db_session):
        self.c = client
        self.db = db_session
        self.pw = secrets.token_urlsafe(12)
        self.fin_email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
        # The first Finance user stands in for the bootstrap seed (lifespan does not run here).
        db_session.add(
            User(
                name="Finance One",
                email=self.fin_email,
                password_hash=hash_password(self.pw),
                role="Finance",
            )
        )
        db_session.commit()
        self.fin = self.login(self.fin_email)
        self.fin_id = self.c.get("/api/auth/me", headers=self.fin).json()["id"]
        r = self.c.post(
            "/api/categories",
            json={"name": f"Cat-{uuid.uuid4().hex[:8]}", "limit_gbp": "10.00"},
            headers=self.fin,
        )
        assert r.status_code == 201, r.text
        self.limited = r.json()["id"]
        r = self.c.post(
            "/api/categories", json={"name": f"Free-{uuid.uuid4().hex[:8]}"}, headers=self.fin
        )
        self.free = r.json()["id"]

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

    def claim(self, h, amount="5.00", cat=None, submit=True):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        r = self.c.post(
            f"/api/claims/{cid}/lines",
            json={
                "date": "2026-01-05",
                "category_id": cat or self.free,
                "amount_gbp": amount,
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
        if submit:
            s = self.c.post(f"/api/claims/{cid}/submit", headers=h)
            assert s.status_code == 200, s.text
        return cid

    def decide(self, cid, h, decision, comment=None):
        body = {"decision": decision}
        if comment is not None:
            body["comment"] = comment
        return self.c.post(f"/api/claims/{cid}/decision", json=body, headers=h)

    def get(self, cid, h):
        return self.c.get(f"/api/claims/{cid}", headers=h)

    def hist(self, cid, h):
        r = self.c.get(f"/api/claims/{cid}/history", headers=h)
        assert r.status_code == 200, r.text
        return r.json()

    def queue(self, h):
        r = self.c.get("/api/approvals/queue", headers=h)
        assert r.status_code == 200, r.text
        return r.json()

    def qids(self, h):
        return [c["id"] for c in self.queue(h)]


@pytest.fixture
def w(client, db_session):
    return W(client, db_session)


def _status(w, cid, h):
    return w.get(cid, h).json()["status"]


def test_ac052_manager_approve_moves_to_finance_with_decider(w):
    mid, mh = w.user("Manager", name="Mina Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid = w.claim(eh)
    assert _status(w, cid, eh) == "pending_manager"
    r = w.decide(cid, mh, "approve")
    assert r.status_code == 200, r.text
    assert _status(w, cid, eh) == "pending_finance"
    assert cid in w.qids(w.fin)
    assert cid not in w.qids(mh)
    last = w.hist(cid, mh)[-1]
    assert last["old_status"] == "pending_manager" and last["new_status"] == "pending_finance"
    assert last["actor_name"] == "Mina Manager"


def test_ac053_manager_reject_with_comment_returns_editable_draft(w):
    mid, mh = w.user("Manager", name="Rita Reject")
    _, eh = w.user("Employee", manager_id=mid)
    cid = w.claim(eh)
    r = w.decide(cid, mh, "reject", "Receipt unclear")
    assert r.status_code == 200, r.text
    got = w.get(cid, eh).json()
    assert got["status"] == "draft"
    assert got["last_rejection"]["comment"] == "Receipt unclear"
    assert "Rita Reject" in got["last_rejection"]["decided_by_name"]
    body = {"date": "2026-01-06", "category_id": w.free, "amount_gbp": "1.00", "description": "x"}
    assert w.c.post(f"/api/claims/{cid}/lines", json=body, headers=eh).status_code == 201
    assert w.hist(cid, eh)[-1]["comment"] == "Receipt unclear"


@pytest.mark.parametrize("comment", [None, "", "   "])
def test_ac054_reject_without_comment_422(w, comment):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    cid = w.claim(eh)
    n = len(w.hist(cid, eh))
    assert w.decide(cid, mh, "reject", comment).status_code == 422
    assert _status(w, cid, eh) == "pending_manager"
    assert len(w.hist(cid, eh)) == n


def test_ac055_manager_own_and_non_report_claims_refused(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    other_mid, other_mh = w.user("Manager")
    own = w.claim(mh)  # manager has no manager -> pending_finance
    assert w.decide(own, mh, "approve").status_code in (403, 404)
    cid = w.claim(eh)
    assert w.decide(cid, other_mh, "approve").status_code in (403, 404)
    assert w.decide(cid, other_mh, "reject", "no").status_code in (403, 404)
    assert _status(w, cid, eh) == "pending_manager"
    assert _status(w, own, w.fin) == "pending_finance"
    # employee cannot decide (not a report-holder)
    assert w.decide(cid, eh, "approve").status_code in (403, 404)


def test_ac056_ac061_over_limit_flag_for_manager_and_finance(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    over = w.claim(eh, amount="10.01", cat=w.limited)
    within = w.claim(eh, amount="10.00", cat=w.limited)
    by_id = {c["id"]: c for c in w.queue(mh)}
    assert by_id[over]["lines"][0]["over_limit"] is True
    assert by_id[within]["lines"][0]["over_limit"] is False
    assert w.get(over, mh).json()["lines"][0]["over_limit"] is True
    assert w.decide(over, mh, "approve").status_code == 200
    assert w.decide(within, mh, "approve").status_code == 200
    fq = {c["id"]: c for c in w.queue(w.fin)}
    assert fq[over]["lines"][0]["over_limit"] is True
    assert fq[within]["lines"][0]["over_limit"] is False
    assert w.get(over, w.fin).json()["lines"][0]["over_limit"] is True


def test_ac057_finance_approve_records_name_time_comment(w):
    _, eh = w.user("Employee")
    cid = w.claim(eh)
    assert _status(w, cid, eh) == "pending_finance"
    r = w.decide(cid, w.fin, "approve", "Looks fine")
    assert r.status_code == 200, r.text
    assert _status(w, cid, eh) == "approved"
    last = w.hist(cid, eh)[-1]
    assert last["new_status"] == "approved" and last["comment"] == "Looks fine"
    assert last["actor_name"] == "Finance One" and last["created_at"]
    assert cid not in w.qids(w.fin)


def test_ac058_finance_reject_returns_draft_with_comment(w):
    _, eh = w.user("Employee")
    cid = w.claim(eh)
    assert w.decide(cid, w.fin, "reject").status_code == 422
    assert w.decide(cid, w.fin, "reject", "Wrong category").status_code == 200
    got = w.get(cid, eh).json()
    assert got["status"] == "draft"
    assert got["last_rejection"]["comment"] == "Wrong category"


def test_ac059_submitter_refused_by_finance_stage(w):
    eid, eh = w.user("Employee")
    cid = w.claim(eh)
    assert w.decide(cid, eh, "approve").status_code in (403, 404)
    assert _status(w, cid, eh) == "pending_finance"


def test_ac060_sole_finance_own_claim_waits_for_second_finance(w):
    cid = w.claim(w.fin)
    assert _status(w, cid, w.fin) == "pending_finance"
    assert cid not in w.qids(w.fin)
    assert w.decide(cid, w.fin, "approve").status_code in (403, 404)
    assert _status(w, cid, w.fin) == "pending_finance"
    _, f2 = w.user("Finance")
    assert cid in w.qids(f2)
    assert cid not in w.qids(w.fin)
    assert w.decide(cid, f2, "approve").status_code == 200
    assert _status(w, cid, w.fin) == "approved"


def test_ac066_nfr005_every_role_refused_own_claim_unchanged(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    claims = [(w.claim(eh), eh), (w.claim(mh), mh), (w.claim(w.fin), w.fin)]
    for cid, h in claims:
        before = _status(w, cid, h)
        n = len(w.hist(cid, h))
        for dec, com in (("approve", None), ("reject", "nope")):
            assert w.decide(cid, h, dec, com).status_code in (403, 404)
        assert _status(w, cid, h) == before
        assert len(w.hist(cid, h)) == n


def test_ac067_manager_claim_routes_to_manager_then_finance(w):
    boss_id, boss = w.user("Manager")
    _, mh = w.user("Manager", manager_id=boss_id)
    cid = w.claim(mh)
    assert _status(w, cid, mh) == "pending_manager"
    assert cid in w.qids(boss) and cid not in w.qids(mh)
    assert w.decide(cid, boss, "approve").status_code == 200
    assert _status(w, cid, mh) == "pending_finance"
    assert cid in w.qids(w.fin)
    assert w.decide(cid, w.fin, "approve").status_code == 200
    assert _status(w, cid, mh) == "approved"


def test_ac068_finance_claim_decided_only_by_other_finance(w):
    cid = w.claim(w.fin)
    _, f2 = w.user("Finance")
    assert w.decide(cid, w.fin, "approve").status_code in (403, 404)
    assert w.decide(cid, f2, "approve").status_code == 200
    assert _status(w, cid, w.fin) == "approved"


def test_ac095_submit_approve_reject_write_entries(w):
    mid, mh = w.user("Manager", name="Hist Mgr")
    _, eh = w.user("Employee", manager_id=mid)
    cid = w.claim(eh)
    h = w.hist(cid, eh)
    assert len(h) == 1
    assert (h[0]["old_status"], h[0]["new_status"]) == ("draft", "pending_manager")
    assert h[0]["created_at"] and h[0]["actor_name"]
    w.decide(cid, mh, "approve")
    w.decide(cid, w.fin, "reject", "back")
    h = w.hist(cid, eh)
    assert [(e["old_status"], e["new_status"]) for e in h] == [
        ("draft", "pending_manager"),
        ("pending_manager", "pending_finance"),
        ("pending_finance", "draft"),
    ]
    assert h[1]["actor_name"] == "Hist Mgr"
    assert h[2]["comment"] == "back"


def test_ac096_history_time_ordered_and_404_when_invisible(w):
    _, eh = w.user("Employee")
    _, other = w.user("Employee")
    cid = w.claim(eh)
    w.decide(cid, w.fin, "reject", "again")
    w.c.post(f"/api/claims/{cid}/submit", headers=eh)
    times = [e["created_at"] for e in w.hist(cid, eh)]
    assert times == sorted(times) and len(times) == 3
    assert w.c.get(f"/api/claims/{cid}/history", headers=other).status_code == 404
    assert w.c.get("/api/claims/999999/history", headers=eh).status_code == 404
    assert w.c.get(f"/api/claims/{cid}/history").status_code == 401


def test_ac097_no_edit_or_delete_route_for_history(w):
    _, eh = w.user("Employee")
    cid = w.claim(eh)
    for m in ("put", "patch", "delete", "post"):
        for path in (f"/api/claims/{cid}/history", f"/api/claims/{cid}/history/1"):
            r = getattr(w.c, m)(path, headers=w.fin)
            assert r.status_code in (404, 405, 422), (m, path, r.status_code)
            assert r.status_code != 200
    assert len(w.hist(cid, eh)) == 1


def test_ac097_nfr009_entries_keep_actor_name_after_deactivation(w):
    mid, mh = w.user("Manager", name="Gone Manager")
    eid, eh = w.user("Employee", manager_id=mid, name="Gone Employee")
    cid = w.claim(eh)
    assert w.decide(cid, mh, "approve").status_code == 200
    for uid in (mid, eid):
        assert w.c.post(f"/api/users/{uid}/deactivate", headers=w.fin).status_code == 200
    names = [e["actor_name"] for e in w.hist(cid, w.fin)]
    assert names == ["Gone Employee", "Gone Manager"]
