"""Claim notification emails (US-024-1)."""

import logging
import secrets
import uuid

import pytest

from app import email as mail
from app.models import User
from app.security import hash_password
from app.services import notifications

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20


class W:
    def __init__(self, client, db, tmp_path, monkeypatch):
        monkeypatch.delenv("S3_BUCKET", raising=False)
        monkeypatch.delenv("SMTP_HOST", raising=False)
        monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
        mail.outbox.clear()
        self.c = client
        self.pw = secrets.token_urlsafe(12)
        self.fin_email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
        db.add(
            User(
                name="Finance One",
                email=self.fin_email,
                password_hash=hash_password(self.pw),
                role="Finance",
            )
        )
        db.commit()
        self.fin = self.login(self.fin_email)
        self.cat = self.c.post(
            "/api/categories", json={"name": f"C-{uuid.uuid4().hex[:8]}"}, headers=self.fin
        ).json()["id"]

    def login(self, email):
        r = self.c.post("/api/auth/login", json={"email": email, "password": self.pw})
        return {"Authorization": f"Bearer {r.json()['token']}"}

    def user(self, role, manager_id=None):
        email = f"u-{uuid.uuid4().hex[:10]}@example.com"
        r = self.c.post(
            "/api/users",
            json={
                "name": "N",
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
        body = {
            "date": "2026-01-05",
            "category_id": self.cat,
            "amount_gbp": "5.00",
            "description": "t",
        }
        lid = self.c.post(f"/api/claims/{cid}/lines", json=body, headers=h).json()["lines"][0]["id"]
        self.c.put(
            f"/api/claims/{cid}/lines/{lid}/receipt",
            files={"file": ("r", PNG, "image/png")},
            headers=h,
        )
        return cid

    def submit(self, cid, h):
        return self.c.post(f"/api/claims/{cid}/submit", headers=h)

    def decide(self, cid, h, decision, comment=None):
        return self.c.post(
            f"/api/claims/{cid}/decision",
            json={"decision": decision, "comment": comment},
            headers=h,
        )

    def to(self):
        return sorted(m["to"] for m in mail.outbox)


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    return W(client, db_session, tmp_path, monkeypatch)


def test_ac092_submit_emails_manager(w):
    mid, memail, _ = w.user("Manager")
    _, _, eh = w.user("Employee", mid)
    cid = w.draft(eh)
    mail.outbox.clear()
    assert w.submit(cid, eh).status_code == 200
    assert w.to() == [memail]


def test_ac092_no_manager_emails_other_finance_only(w):
    _, f2, _ = w.user("Finance")
    _, _, eh = w.user("Employee")
    cid = w.draft(eh)
    mail.outbox.clear()
    w.submit(cid, eh)
    assert w.to() == sorted([w.fin_email, f2])
    # a Finance owner does not email themselves
    cid = w.draft(w.fin)
    mail.outbox.clear()
    w.submit(cid, w.fin)
    assert w.to() == [f2]


def test_ac092_manager_approval_emails_finance_and_submitter(w):
    mid, _, mh = w.user("Manager")
    _, eemail, eh = w.user("Employee", mid)
    cid = w.draft(eh)
    w.submit(cid, eh)
    mail.outbox.clear()
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.to() == sorted([w.fin_email, eemail])


def test_ac093_outcomes_emailed_with_reference_and_comment(w):
    _, eemail, eh = w.user("Employee")
    cid = w.draft(eh)
    w.submit(cid, eh)
    mail.outbox.clear()
    w.decide(cid, w.fin, "reject", "Blurry receipt")
    (m,) = mail.outbox
    assert m["to"] == eemail and f"EXP-{cid:04d}" in m["body"]
    assert "rejected" in m["body"] and "Blurry receipt" in m["body"]
    w.submit(cid, eh)
    mail.outbox.clear()
    w.decide(cid, w.fin, "approve")
    assert "approved" in mail.outbox[0]["body"]
    _, _, f2 = w.user("Finance")
    mail.outbox.clear()
    assert w.c.post(f"/api/claims/{cid}/mark-paid", headers=f2).status_code == 200
    (m,) = mail.outbox
    assert m["to"] == eemail and "paid" in m["body"] and f"EXP-{cid:04d}" in m["body"]


def test_ac093_failed_action_sends_nothing(w):
    _, _, eh = w.user("Employee")
    cid = w.draft(eh)
    mail.outbox.clear()
    assert w.decide(cid, w.fin, "approve").status_code == 409
    assert w.decide(cid, eh, "approve").status_code in (403, 404)
    assert mail.outbox == []


def test_ac094_send_failure_does_not_block_and_is_logged(w, monkeypatch, caplog):
    def boom(*a, **k):
        raise RuntimeError("smtp down")

    monkeypatch.setattr(notifications, "send_email", boom)
    mid, memail, mh = w.user("Manager")
    _, eemail, eh = w.user("Employee", mid)
    cid = w.draft(eh)
    with caplog.at_level(logging.ERROR):
        r = w.submit(cid, eh)
        assert r.status_code == 200 and r.json()["status"] == "pending_manager"
        r = w.decide(cid, mh, "approve")
        assert r.status_code == 200 and r.json()["status"] == "pending_finance"
    assert f"EXP-{cid:04d}" in caplog.text
    assert memail not in caplog.text and eemail not in caplog.text
    assert "waiting for your approval" not in caplog.text
