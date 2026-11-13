"""QA acceptance: email notifications (US-024), via the API and app.email.outbox."""

import secrets
import uuid

import pytest

from app import email as app_email
from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


class W:
    def __init__(self, client, db_session):
        self.c = client
        self.pw = secrets.token_urlsafe(12)
        self.fin_email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
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
        r = self.c.post(
            "/api/categories", json={"name": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=self.fin
        )
        assert r.status_code == 201, r.text
        self.cat = r.json()["id"]

    def login(self, email):
        r = self.c.post("/api/auth/login", json={"email": email, "password": self.pw})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['token']}"}

    def user(self, role, manager_id=None):
        email = f"u-{uuid.uuid4().hex[:10]}@example.com"
        r = self.c.post(
            "/api/users",
            json={
                "name": f"N {uuid.uuid4().hex[:6]}",
                "email": email,
                "role": role,
                "manager_id": manager_id,
                "initial_password": self.pw,
            },
            headers=self.fin,
        )
        assert r.status_code == 201, r.text
        return r.json()["id"], email, self.login(email)

    def draft(self, h):
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
        return cid

    def submit(self, cid, h):
        return self.c.post(f"/api/claims/{cid}/submit", headers=h)

    def decide(self, cid, h, decision, comment=None):
        body = {"decision": decision}
        if comment is not None:
            body["comment"] = comment
        return self.c.post(f"/api/claims/{cid}/decision", json=body, headers=h)

    def status(self, cid, h):
        return self.c.get(f"/api/claims/{cid}", headers=h).json()["status"]


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.delenv("SMTP_HOST", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return W(client, db_session)


@pytest.fixture(autouse=True)
def _clean_outbox():
    app_email.outbox.clear()
    yield
    app_email.outbox.clear()


def _to(addr):
    return [m for m in app_email.outbox if m["to"].lower() == addr.lower()]


class _Boom(list):
    def append(self, item):
        raise RuntimeError("smtp down")


@pytest.fixture
def failing(monkeypatch):
    """Makes every send fail: the outbox write inside send_email raises."""
    monkeypatch.setattr(app_email, "outbox", _Boom())


def test_ac092_submit_emails_manager_not_submitter(w):
    mid, memail, mh = w.user("Manager")
    _, eemail, eh = w.user("Employee", manager_id=mid)
    cid = w.draft(eh)
    app_email.outbox.clear()
    assert w.submit(cid, eh).status_code == 200
    assert len(_to(memail)) >= 1
    assert _to(eemail) == []
    assert _to(w.fin_email) == []


def test_ac092_no_manager_emails_finance_who_can_act_not_submitter(w):
    _, eemail, eh = w.user("Employee")
    _, f2email, _ = w.user("Finance")
    cid = w.draft(eh)
    app_email.outbox.clear()
    assert w.submit(cid, eh).status_code == 200
    assert len(_to(w.fin_email)) >= 1
    assert len(_to(f2email)) >= 1
    assert _to(eemail) == []


def test_ac092_finance_submitter_not_emailed_as_approver(w):
    _, f2email, _ = w.user("Finance")
    cid = w.draft(w.fin)
    app_email.outbox.clear()
    assert w.submit(cid, w.fin).status_code == 200
    assert len(_to(f2email)) >= 1
    assert _to(w.fin_email) == []


def test_ac093_manager_approve_emails_submitter(w):
    mid, _, mh = w.user("Manager")
    _, eemail, eh = w.user("Employee", manager_id=mid)
    cid = w.draft(eh)
    w.submit(cid, eh)
    app_email.outbox.clear()
    assert w.decide(cid, mh, "approve", "Fine by me").status_code == 200
    msgs = _to(eemail)
    assert len(msgs) >= 1
    assert "approv" in (msgs[0]["subject"] + msgs[0]["body"]).lower()


def test_ac093_manager_reject_emails_submitter_with_comment(w):
    mid, _, mh = w.user("Manager")
    _, eemail, eh = w.user("Employee", manager_id=mid)
    cid = w.draft(eh)
    w.submit(cid, eh)
    app_email.outbox.clear()
    note = f"note-{uuid.uuid4().hex[:8]}"
    assert w.decide(cid, mh, "reject", note).status_code == 200
    msgs = _to(eemail)
    assert len(msgs) >= 1
    assert "reject" in (msgs[0]["subject"] + msgs[0]["body"]).lower()
    assert note in msgs[0]["body"]


def test_ac093_finance_approve_emails_submitter_with_comment(w):
    _, eemail, eh = w.user("Employee")
    cid = w.draft(eh)
    w.submit(cid, eh)
    app_email.outbox.clear()
    note = f"note-{uuid.uuid4().hex[:8]}"
    assert w.decide(cid, w.fin, "approve", note).status_code == 200
    msgs = _to(eemail)
    assert len(msgs) >= 1
    assert "approv" in (msgs[0]["subject"] + msgs[0]["body"]).lower()
    assert note in msgs[0]["body"]


def test_ac093_finance_reject_emails_submitter_with_comment(w):
    _, eemail, eh = w.user("Employee")
    cid = w.draft(eh)
    w.submit(cid, eh)
    app_email.outbox.clear()
    note = f"note-{uuid.uuid4().hex[:8]}"
    assert w.decide(cid, w.fin, "reject", note).status_code == 200
    msgs = _to(eemail)
    assert len(msgs) >= 1
    assert "reject" in (msgs[0]["subject"] + msgs[0]["body"]).lower()
    assert note in msgs[0]["body"]


def test_ac093_mark_paid_emails_submitter(w):
    _, eemail, eh = w.user("Employee")
    _, _, f2 = w.user("Finance")
    cid = w.draft(eh)
    w.submit(cid, eh)
    assert w.decide(cid, w.fin, "approve").status_code == 200
    app_email.outbox.clear()
    assert w.c.post(f"/api/claims/{cid}/mark-paid", headers=f2).status_code == 200
    msgs = _to(eemail)
    assert len(msgs) >= 1
    assert "paid" in (msgs[0]["subject"] + msgs[0]["body"]).lower()


def test_ac094_nfr010_submit_succeeds_when_email_fails(w, failing):
    mid, _, _ = w.user("Manager")
    _, _, eh = w.user("Employee", manager_id=mid)
    cid = w.draft(eh)
    r = w.submit(cid, eh)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "pending_manager"
    assert w.status(cid, eh) == "pending_manager"


def test_ac094_nfr010_decisions_succeed_when_email_fails(w, failing):
    mid, _, mh = w.user("Manager")
    _, _, eh = w.user("Employee", manager_id=mid)
    cid = w.draft(eh)
    assert w.submit(cid, eh).status_code == 200
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.status(cid, eh) == "pending_finance"
    assert w.decide(cid, w.fin, "reject", "again").status_code == 200
    assert w.status(cid, eh) == "draft"
    assert w.submit(cid, eh).status_code == 200
    assert w.decide(cid, mh, "reject", "no").status_code == 200
    assert w.status(cid, eh) == "draft"
    assert w.submit(cid, eh).status_code == 200
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.decide(cid, w.fin, "approve").status_code == 200
    assert w.status(cid, eh) == "approved"


def test_ac094_nfr010_mark_paid_succeeds_when_email_fails(w, failing):
    _, _, eh = w.user("Employee")
    _, _, f2 = w.user("Finance")
    cid = w.draft(eh)
    w.submit(cid, eh)
    assert w.decide(cid, w.fin, "approve").status_code == 200
    r = w.c.post(f"/api/claims/{cid}/mark-paid", headers=f2)
    assert r.status_code == 200, r.text
    assert w.status(cid, eh) == "paid"
    hist = w.c.get(f"/api/claims/{cid}/history", headers=eh).json()
    assert hist[-1]["new_status"] == "paid"


def test_nfr008_notification_emails_only_to_relevant_users(w):
    """NFR-008: personal data is limited by role; unrelated users get no mail.

    Hosting region and encryption are infrastructure: not testable here.
    """
    mid, _, mh = w.user("Manager")
    _, _, eh = w.user("Employee", manager_id=mid)
    _, otheremail, _ = w.user("Employee")
    _, omemail, _ = w.user("Manager")
    cid = w.draft(eh)
    w.submit(cid, eh)
    w.decide(cid, mh, "reject", "x")
    assert _to(otheremail) == [] and _to(omemail) == []
