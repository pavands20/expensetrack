"""QA acceptance: Finance CSV export of approved claims (US-023), through the API."""

import csv
import io
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import pytest

from app.models import User
from app.security import hash_password

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 20
URL = "/api/reports/export.csv"
HEADERS = [
    "claim_id",
    "submitter",
    "line_date",
    "category",
    "amount_gbp",
    "description",
    "claim_status",
]


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
        self.catname = f"Cat-{uuid.uuid4().hex[:8]}"
        r = self.c.post("/api/categories", json={"name": self.catname}, headers=self.fin)
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

    def claim(self, h, amounts=("5.00",), approve=True, descs=None):
        cid = self.c.post("/api/claims", json={}, headers=h).json()["id"]
        for i, a in enumerate(amounts):
            r = self.c.post(
                f"/api/claims/{cid}/lines",
                json={
                    "date": "2026-01-05",
                    "category_id": self.cat,
                    "amount_gbp": a,
                    "description": (descs or [f"desc{i}-{cid}"] * len(amounts))[i],
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
        assert self.c.post(f"/api/claims/{cid}/submit", headers=h).status_code == 200
        if approve:
            r = self.c.post(
                f"/api/claims/{cid}/decision", json={"decision": "approve"}, headers=self.fin
            )
            assert r.status_code == 200, r.text
        return cid

    def export(self, start, end, h=None):
        return self.c.get(URL, params={"start": start, "end": end}, headers=h or self.fin)


@pytest.fixture
def w(client, db_session, tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))
    return W(client, db_session)


def _today():
    return datetime.now(UTC).date()


def _window():
    t = _today()
    return (t - timedelta(days=1)).isoformat(), (t + timedelta(days=1)).isoformat()


def _rows(r):
    assert r.status_code == 200, r.text
    assert "csv" in r.headers["content-type"]
    return list(csv.reader(io.StringIO(r.text)))


def test_ac087_one_row_per_line_with_required_columns(w):
    _, eh = w.user("Employee", name="Ella Export")
    cid = w.claim(eh, amounts=("5.00", "7.50"), descs=["first", "second"])
    rows = _rows(w.export(*_window()))
    header = rows[0]
    for col in HEADERS:
        assert col in header, (col, header)
    body = [dict(zip(header, r, strict=False)) for r in rows[1:]]
    mine = [b for b in body if b["description"] in ("first", "second")]
    assert len(mine) == 2
    assert {b["amount_gbp"] for b in mine} == {"5.00", "7.50"}
    for b in mine:
        assert b["submitter"] == "Ella Export"
        assert b["line_date"] == "2026-01-05"
        assert b["category"] == w.catname
        assert b["claim_status"] == "approved"
        assert str(cid) in b["claim_id"]


def test_ac087_paid_claims_included_with_status(w):
    _, eh = w.user("Employee")
    _, f2 = w.user("Finance")
    cid = w.claim(eh, descs=["paidline"])
    assert w.c.post(f"/api/claims/{cid}/mark-paid", headers=f2).status_code == 200
    rows = _rows(w.export(*_window()))
    body = [dict(zip(rows[0], r, strict=False)) for r in rows[1:]]
    assert [b["claim_status"] for b in body if b["description"] == "paidline"] == ["paid"]


def test_ac088_claims_approved_outside_range_excluded(w):
    _, eh = w.user("Employee")
    w.claim(eh, descs=["approvedline"])
    pending = w.claim(eh, approve=False, descs=["pendingline"])
    assert pending
    t = _today()
    past = _rows(w.export("2000-01-01", "2000-01-31"))
    assert len(past) == 1
    lo, hi = (t + timedelta(days=2)).isoformat(), (t + timedelta(days=9)).isoformat()
    future = _rows(w.export(lo, hi))
    assert len(future) == 1
    rows = _rows(w.export(*_window()))
    descs = [dict(zip(rows[0], r, strict=False))["description"] for r in rows[1:]]
    assert "approvedline" in descs
    assert "pendingline" not in descs  # not Finance-approved


def test_ac089_end_before_start_refused_with_message(w):
    r = w.export("2026-02-10", "2026-02-01")
    assert r.status_code == 422, r.text
    assert "text/csv" not in r.headers["content-type"]
    detail = r.json()["detail"]
    assert detail and (isinstance(detail, str) or isinstance(detail, list))


def test_ac090_no_matches_returns_headers_only(w):
    rows = _rows(w.export("2000-01-01", "2000-01-02"))
    assert len(rows) == 1
    for col in HEADERS:
        assert col in rows[0]


def test_ac091_nfr004_employee_and_manager_get_403(w):
    mid, mh = w.user("Manager")
    _, eh = w.user("Employee", manager_id=mid)
    for h in (eh, mh):
        r = w.export(*_window(), h=h)
        assert r.status_code == 403, r.text
        assert r.json() == {"detail": "Forbidden"}
    assert w.c.get(URL, params={"start": _window()[0], "end": _window()[1]}).status_code == 401
    assert w.export(*_window()).status_code == 200


def test_nfr008_export_personal_data_role_limited(w):
    """NFR-008: personal data (submitter names) in the export is limited by role.

    Hosting region and encryption are infrastructure and are not testable via the API.
    """
    mid, mh = w.user("Manager")
    name = f"Privacy {uuid.uuid4().hex[:8]}"
    _, eh = w.user("Employee", name=name)
    w.claim(eh, descs=["privline"])
    params = {"start": _window()[0], "end": _window()[1]}
    for h in (eh, mh, None):
        r = w.c.get(URL, params=params, headers=h or {})
        assert r.status_code == (403 if h else 401), r.text
        assert "csv" not in r.headers.get("content-type", "")
        assert name not in r.text
    ok = w.export(*_window())
    assert ok.status_code == 200
    assert name in ok.text
    assert ok.headers["cache-control"] == "private, no-store"
