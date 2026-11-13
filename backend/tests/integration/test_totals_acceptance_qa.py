"""QA acceptance: Finance totals report (US-022), through the API."""

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
            User(
                name="Finance One",
                email=email,
                password_hash=hash_password(self.pw),
                role="Finance",
            )
        )
        db_session.commit()
        self.fin = self.login(email)

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

    def category(self):
        name = f"Cat-{uuid.uuid4().hex[:8]}"
        r = self.c.post("/api/categories", json={"name": name}, headers=self.fin)
        assert r.status_code == 201, r.text
        return r.json()["id"], name

    def claim(self, h, cat, amounts, submit=True):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        for a in amounts:
            r = self.c.post(
                f"/api/claims/{cid}/lines",
                json={"date": "2026-01-05", "category_id": cat, "amount_gbp": a,
                      "description": "t"},
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

    def decide(self, cid, h, decision, comment=None):
        body = {"decision": decision}
        if comment:
            body["comment"] = comment
        return self.c.post(f"/api/claims/{cid}/decision", json=body, headers=h)

    def totals(self, h=None):
        r = self.c.get(URL, headers=h or self.fin)
        assert r.status_code == 200, r.text
        return r.json()

    def for_cat(self, cat):
        return [t for t in self.totals() if t["category_id"] == cat]


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return W(client, db_session)


def test_ac084_per_category_per_month_sums_as_two_decimal_strings(w):
    _, eh = w.user("Employee")
    _, f2 = w.user("Finance")
    c1, n1 = w.category()
    c2, n2 = w.category()
    a = w.claim(eh, c1, ["10.10", "5.40"])
    b = w.claim(eh, c1, ["4.00"])
    c = w.claim(eh, c2, ["7.50"])
    for cid in (a, b, c):
        assert w.decide(cid, f2, "approve").status_code == 200
    assert w.c.post(f"/api/claims/{b}/mark-paid", headers=f2).status_code == 200
    month = datetime.now(UTC).strftime("%Y-%m")
    assert w.for_cat(c1) == [
        {"month": month, "category_id": c1, "category": n1, "total_gbp": "19.50"}
    ]
    assert w.for_cat(c2) == [
        {"month": month, "category_id": c2, "category": n2, "total_gbp": "7.50"}
    ]
    rows = w.totals()
    keys = [(-int(r["month"].replace("-", "")), r["category"], r["category_id"]) for r in rows]
    assert keys == sorted(keys)


def test_ac085_non_approved_states_do_not_change_totals(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    _, e2 = w.user("Employee")
    cat, _ = w.category()
    before = w.totals()
    w.claim(eh, cat, ["1.00"], submit=False)  # draft
    w.claim(eh, cat, ["2.00"])  # pending_manager
    w.claim(e2, cat, ["3.00"])  # pending_finance
    mgr_ok = w.claim(eh, cat, ["4.00"])
    assert w.decide(mgr_ok, mh, "approve").status_code == 200  # manager-approved
    rej = w.claim(e2, cat, ["5.00"])
    assert w.decide(rej, w.fin, "reject", "no").status_code == 200  # rejected
    assert w.totals() == before
    assert w.for_cat(cat) == []


def test_ac086_nfr004_nfr008_roles_and_no_personal_data(w):
    mid, mh = w.user("Manager")
    name = f"Privacy {uuid.uuid4().hex[:8]}"
    _, eh = w.user("Employee", manager_id=mid, name=name)
    cat, _ = w.category()
    cid = w.claim(eh, cat, ["3.00"])
    assert w.decide(cid, mh, "approve").status_code == 200
    assert w.decide(cid, w.fin, "approve").status_code == 200
    for h in (eh, mh):
        r = w.c.get(URL, headers=h)
        assert r.status_code == 403, r.text
        assert r.json() == {"detail": "Forbidden"}
    r = w.c.get(URL)
    assert r.status_code == 401
    assert r.json() == {"detail": "Not authenticated"}
    ok = w.c.get(URL, headers=w.fin)
    assert ok.status_code == 200
    assert name not in ok.text
    for row in ok.json():
        assert set(row) == {"month", "category_id", "category", "total_gbp"}
