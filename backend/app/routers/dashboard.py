"""The caller's own claims grouped by dashboard status."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_auth
from app.models import Claim, User
from app.routers.claims import _outs
from app.schemas import ClaimOut

router = APIRouter()

# dashboard group -> claim status
GROUPS = {
    "draft": "draft",
    "submitted": "pending_manager",
    "manager_approved": "pending_finance",
    "approved": "approved",
    "paid": "paid",
}


class DashboardCounts(BaseModel):
    draft: int
    submitted: int
    manager_approved: int
    approved: int
    paid: int


class DashboardClaims(BaseModel):
    draft: list[ClaimOut]
    submitted: list[ClaimOut]
    manager_approved: list[ClaimOut]
    approved: list[ClaimOut]
    paid: list[ClaimOut]


class DashboardOut(BaseModel):
    counts: DashboardCounts
    claims: DashboardClaims


@router.get("/api/dashboard/me", response_model=DashboardOut)
def my_dashboard(user: User = Depends(require_auth), db: Session = Depends(get_db)) -> DashboardOut:
    rows = list(
        db.scalars(
            select(Claim)
            .where(Claim.owner_id == user.id, Claim.status.in_(list(GROUPS.values())))
            .order_by(Claim.created_at.desc(), Claim.id.desc())
        )
    )
    outs = dict(zip([c.id for c in rows], _outs(db, rows), strict=True))
    claims = {
        group: [outs[c.id] for c in rows if c.status == status] for group, status in GROUPS.items()
    }
    return DashboardOut(
        counts=DashboardCounts(**{g: len(v) for g, v in claims.items()}),
        claims=DashboardClaims(**claims),
    )
