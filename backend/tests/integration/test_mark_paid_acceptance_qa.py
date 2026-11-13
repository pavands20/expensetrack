"""QA acceptance: Finance marks an approved claim as paid (US-016), through the API."""

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
        self.pw = secrets.token_urlsafe(12)
        email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
        # Stands in for the bootstrap Finance user (lifespan does not run in tests).
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

    def claim(self, h, submit=True):
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
        if submit:
            s = self.c.post(f"/api/claims/{cid}/submit", headers=h)
            assert s.status_code == 200, s.text
        return cid

    def approve(self, cid, h):
        r = self.c.post(f"/api/claims/{cid}/decision", json={"decision": "approve"}, headers=h)
        assert r.status_code == 200, r.text

    def pay(self, cid, h):
        return self.c.post(f"/api/claims/{cid}/mark-paid", headers=h)

    def status(self, cid, h):
        return self.c.get(f"/api/claims/{cid}", headers=h).json()["status"]

    def hist(self, cid, h):
        r = self.c.get(f"/api/claims/{cid}/history", headers=h)
        assert r.status_code == 200, r.text
        return r.json()


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return W(client, db_session)


def _approved(w, owner_h, manager_h=None):
    cid = w.claim(owner_h)
    if manager_h is not None:
        w.approve(cid, manager_h)
    w.approve(cid, w.fin)
    assert w.status(cid, owner_h) == "approved"
    return cid


def test_ac062_finance_marks_approved_claim_paid_with_history(w):
    _, eh = w.user("Employee")
    cid = _approved(w, eh)
    _, f2 = w.user("Finance", name="Pat Payer")
    r = w.pay(cid, f2)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "paid"
    assert w.status(cid, eh) == "paid"
    last = w.hist(cid, eh)[-1]
    assert last["old_status"] == "approved" and last["new_status"] == "paid"
    assert last["actor_name"] == "Pat Payer" and last["created_at"]
    # status change only: no payment resource or route exists
    assert w.c.post(f"/api/claims/{cid}/pay", headers=f2).status_code in (404, 405)


def test_ac063_non_approved_claims_refused_409_and_unchanged(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    _, e2 = w.user("Employee")
    _, f2 = w.user("Finance")
    draft = w.claim(eh, submit=False)
    pend_mgr = w.claim(eh)
    pend_fin = w.claim(e2)
    paid = _approved(w, e2)
    assert w.pay(paid, f2).status_code == 200
    n_paid = len(w.hist(paid, e2))
    cases = [
        (draft, eh, "draft"),
        (pend_mgr, eh, "pending_manager"),
        (pend_fin, e2, "pending_finance"),
        (paid, e2, "paid"),
    ]
    for cid, owner_h, expected in cases:
        assert w.status(cid, owner_h) == expected
        n = len(w.hist(cid, owner_h))
        r = w.pay(cid, f2)
        assert r.status_code == 409, (expected, r.status_code, r.text)
        assert isinstance(r.json()["detail"], str)
        assert w.status(cid, owner_h) == expected
        assert len(w.hist(cid, owner_h)) == n
    assert len(w.hist(paid, e2)) == n_paid


def test_ac064_nfr004_employee_and_manager_get_403_claim_stays_approved(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    _, other = w.user("Employee")
    cid = _approved(w, eh, mh)
    n = len(w.hist(cid, eh))
    # an unrelated employee cannot see the claim: 404 is checked before the role check
    r = w.pay(cid, other)
    assert r.status_code == 404, r.text
    assert r.json() == {"detail": "Claim not found"}
    for h in (mh, eh):
        r = w.pay(cid, h)
        assert r.status_code == 403, r.text
        assert r.json() == {"detail": "Forbidden"}
    # a manager paying someone else's visible claim, and a manager's own claim
    own = w.claim(mh)
    w.approve(own, w.fin)
    assert w.pay(own, mh).status_code == 403
    assert w.status(own, w.fin) == "approved"
    assert w.status(cid, eh) == "approved"
    assert len(w.hist(cid, eh)) == n
    assert w.c.post(f"/api/claims/{cid}/mark-paid").status_code == 401


def test_ac065_nfr005_finance_submitter_refused_claim_stays_approved(w):
    _, f2 = w.user("Finance")
    cid = w.claim(w.fin)
    w.approve(cid, f2)
    assert w.status(cid, w.fin) == "approved"
    n = len(w.hist(cid, w.fin))
    r = w.pay(cid, w.fin)
    assert r.status_code in (403, 404), r.text
    assert w.status(cid, w.fin) == "approved"
    assert len(w.hist(cid, w.fin)) == n
    # another Finance user can still pay it
    assert w.pay(cid, f2).status_code == 200
    assert w.status(cid, w.fin) == "paid"


def test_nfr008_mark_paid_unknown_claim_404(w):
    assert w.pay(999999, w.fin).status_code == 404
    # hosting region and encryption are infrastructure: not testable here
