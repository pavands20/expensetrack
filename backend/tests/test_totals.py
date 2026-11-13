"""Finance totals report: approved/paid line amounts per month and category."""

import secrets
import uuid
from datetime import UTC, datetime

import pytest

from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20
URL = "/api/reports/totals"


class W:
    def __init__(self, client, db_session):
        self.c = client
        self.pw = secrets.token_urlsafe(12)
        email = f"fin-{uuid.uuid4().hex[:8]}@example.com"
        db_session.add(
            User(name="Fin", email=email, password_hash=hash_password(self.pw), role="Finance")
        )
        db_session.commit()
        self.fin = self.login(email)

    def login(self, email):
        r = self.c.post("/api/auth/login", json={"email": email, "password": self.pw})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['token']}"}

    def user(self, role):
        email = f"u-{uuid.uuid4().hex[:10]}@example.com"
        r = self.c.post(
            "/api/users",
            json={
                "name": "N",
                "email": email,
                "role": role,
                "initial_password": self.pw,
            },
            headers=self.fin,
        )
        assert r.status_code == 201, r.text
        return self.login(email)

    def cat(self, name):
        r = self.c.post("/api/categories", json={"name": name}, headers=self.fin)
        assert r.status_code == 201, r.text
        return r.json()["id"]

    def claim(self, h, lines, submit=True):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        for cat, amount in lines:
            r = self.c.post(
                f"/api/claims/{cid}/lines",
                json={
                    "date": "2026-01-05",
                    "category_id": cat,
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
            assert self.c.post(f"/api/claims/{cid}/submit", headers=h).status_code == 200
        return cid

    def decide(self, cid, decision, comment=None):
        body = {"decision": decision, "comment": comment}
        return self.c.post(f"/api/claims/{cid}/decision", json=body, headers=self.fin)


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return W(client, db_session)


def test_ac084_sums_per_month_and_category_approved_and_paid(w):
    a, b = w.cat(f"A-{uuid.uuid4().hex[:6]}"), w.cat(f"B-{uuid.uuid4().hex[:6]}")
    eh = w.user("Employee")
    f2 = w.user("Finance")
    c1 = w.claim(eh, [(a, "10.10"), (a, "2.40"), (b, "1.00")])
    c2 = w.claim(eh, [(a, "5.00")])
    assert w.decide(c1, "approve").status_code == 200
    assert w.decide(c2, "approve").status_code == 200
    assert w.c.post(f"/api/claims/{c2}/mark-paid", headers=f2).status_code == 200
    r = w.c.get(URL, headers=w.fin)
    assert r.status_code == 200, r.text
    month = datetime.now(UTC).strftime("%Y-%m")
    rows = {x["category_id"]: x for x in r.json()}
    assert set(rows) == {a, b}
    assert rows[a]["total_gbp"] == "17.50" and rows[a]["month"] == month
    assert rows[b]["total_gbp"] == "1.00"
    assert [x["category"][0] for x in r.json()] == ["A", "B"]


def test_ac085_unapproved_and_rejected_contribute_nothing(w):
    a = w.cat(f"A-{uuid.uuid4().hex[:6]}")
    eh = w.user("Employee")
    w.claim(eh, [(a, "3.00")], submit=False)
    w.claim(eh, [(a, "4.00")])  # pending_finance
    rej = w.claim(eh, [(a, "6.00")])
    assert w.decide(rej, "reject", "no").status_code == 200
    assert w.c.post(f"/api/claims/{rej}/submit", headers=eh).status_code == 200
    r = w.c.get(URL, headers=w.fin)
    assert r.status_code == 200 and r.json() == []


def test_ac086_roles_and_401(w):
    mh = w.user("Manager")
    eh = w.user("Employee")
    for h in (eh, mh):
        r = w.c.get(URL, headers=h)
        assert r.status_code == 403 and r.json() == {"detail": "Forbidden"}
    r = w.c.get(URL)
    assert r.status_code == 401 and r.json() == {"detail": "Not authenticated"}
