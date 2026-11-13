"""Finance-only CSV export of approved claim lines."""

import csv
import datetime as dt
import io
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_finance
from app.models import Category, Claim, ClaimLine, ClaimStatusChange, User

router = APIRouter(dependencies=[Depends(require_finance)])

HEADER = [
    "claim_id",
    "submitter",
    "line_date",
    "category",
    "amount_gbp",
    "description",
    "claim_status",
]


def _safe(value: str) -> str:
    return "'" + value if value[:1] in ("=", "+", "-", "@") else value


@router.get("/api/reports/export.csv")
def export_csv(start: dt.date, end: dt.date, db: Session = Depends(get_db)) -> Response:
    if end < start:
        raise HTTPException(status_code=422, detail="End date must not be before the start date")
    lo = datetime.combine(start, dt.time.min, tzinfo=UTC)
    hi = datetime.combine(end, dt.time.min, tzinfo=UTC) + timedelta(days=1)
    approved_at = (
        select(
            ClaimStatusChange.claim_id.label("cid"),
            func.max(ClaimStatusChange.created_at).label("at"),
        )
        .where(ClaimStatusChange.new_status == "approved")
        .group_by(ClaimStatusChange.claim_id)
        .subquery()
    )
    rows = db.execute(
        select(Claim, ClaimLine, Category, User)
        .join(approved_at, approved_at.c.cid == Claim.id)
        .join(ClaimLine, ClaimLine.claim_id == Claim.id)
        .join(Category, Category.id == ClaimLine.category_id)
        .join(User, User.id == Claim.owner_id)
        .where(
            Claim.status.in_(("approved", "paid")),
            approved_at.c.at >= lo,
            approved_at.c.at < hi,
        )
        .order_by(Claim.id, ClaimLine.date, ClaimLine.id)
    ).all()
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\r\n")
    writer.writerow(HEADER)
    for claim, line, cat, owner in rows:
        writer.writerow(
            [
                claim.reference,
                _safe(owner.name),
                line.date.isoformat(),
                _safe(cat.name),
                f"{Decimal(line.amount):.2f}",
                _safe(line.description),
                claim.status,
            ]
        )
    return Response(
        buf.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="claims-{start}-to-{end}.csv"',
            "Cache-Control": "private, no-store",
        },
    )
