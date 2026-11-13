"""CSV export of approved claim lines."""

import csv
import datetime as dt
import io
import secrets
from datetime import UTC, datetime

import pytest

from app.models import Category, Claim, ClaimLine, ClaimStatusChange, User
from app.security import hash_password

HEAD = "claim_id,submitter,line_date,category,amount_gbp,description,claim_status"


@pytest.fixture
def world(client, db_session):
    pw = secrets.token_urlsafe(12)
    db = db_session
    fin = User(name="Fin", email="f@x.com", password_hash=hash_password(pw), role="Finance")
    emp = User(name="=Evil", email="e@x.com", password_hash=hash_password(pw), role="Employee")
    cat = Category(name="Travel")
    db.add_all([fin, emp, cat])
    db.commit()
    h = {}
    for n in ("f", "e"):
        t = client.post("/api/auth/login", json={"email": f"{n}@x.com", "password": pw})
        h[n] = {"Authorization": f"Bearer {t.json()['token']}"}

    def claim(status, approved_on):
        c = Claim(owner_id=emp.id, status=status)
        db.add(c)
        db.commit()
        for d, amt in (("2026-02-02", "3.5"), ("2026-02-01", "12.5")):
            db.add(
                ClaimLine(
                    claim_id=c.id,
                    date=dt.date.fromisoformat(d),
                    category_id=cat.id,
                    amount=amt,
                    description="+sum",
                )
            )
        if approved_on:
            db.add(
                ClaimStatusChange(
                    claim_id=c.id,
                    old_status="pending_finance",
                    new_status="approved",
                    actor_id=fin.id,
                    actor_name="Fin",
                    created_at=datetime.fromisoformat(approved_on).replace(tzinfo=UTC),
                )
            )
        db.commit()
        return c

    return h, claim


def _get(client, h, qs="start=2026-03-01&end=2026-03-31"):
    return client.get(f"/api/reports/export.csv?{qs}", headers=h)


def test_ac087_ac088_rows_and_range(client, world):
    h, claim = world
    a = claim("approved", "2026-03-31T23:59:59")
    p = claim("paid", "2026-03-01T00:00:00")
    claim("approved", "2026-04-01T00:00:00")
    claim("approved", "2026-02-28T23:59:59")
    claim("pending_finance", None)
    claim("draft", None)
    r = _get(client, h["f"])
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert r.headers["content-disposition"].startswith("attachment")
    rows = list(csv.reader(io.StringIO(r.text)))
    assert ",".join(rows[0]) == HEAD
    assert [x[0] for x in rows[1:]] == [a.reference] * 2 + [p.reference] * 2
    assert rows[1][1:] == ["'=Evil", "2026-02-01", "Travel", "12.50", "'+sum", "approved"]
    assert rows[2][2] == "2026-02-02" and rows[2][4] == "3.50"
    assert rows[3][6] == "paid"


def test_ac089_bad_dates_422(client, world):
    h, _ = world
    r = _get(client, h["f"], "start=2026-03-02&end=2026-03-01")
    assert r.status_code == 422
    assert r.json()["detail"] == "End date must not be before the start date"
    for qs in ("", "start=2026-03-01", "start=x&end=y"):
        assert _get(client, h["f"], qs).status_code == 422


def test_ac090_empty_header_only(client, world):
    h, _ = world
    r = _get(client, h["f"])
    assert r.status_code == 200
    assert r.text.strip() == HEAD


def test_ac091_roles(client, world):
    h, _ = world
    r = _get(client, h["e"])
    assert r.status_code == 403 and r.json() == {"detail": "Forbidden"}
    assert _get(client, {}).status_code == 401
