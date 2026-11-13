"""Read-only claim status history."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import aware, require_auth
from app.models import ClaimStatusChange, User
from app.routers.claims import _visible_claim

router = APIRouter()


class HistoryOut(BaseModel):
    id: int
    claim_id: int
    old_status: str
    new_status: str
    actor_id: int
    actor_name: str
    comment: str | None
    created_at: str


@router.get("/api/claims/{claim_id}/history", response_model=list[HistoryOut])
def claim_history(
    claim_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> list[HistoryOut]:
    _visible_claim(db, claim_id, user)
    rows = db.scalars(
        select(ClaimStatusChange)
        .where(ClaimStatusChange.claim_id == claim_id)
        .order_by(ClaimStatusChange.created_at, ClaimStatusChange.id)
    )
    return [
        HistoryOut(
            id=r.id,
            claim_id=r.claim_id,
            old_status=r.old_status,
            new_status=r.new_status,
            actor_id=r.actor_id,
            actor_name=r.actor_name,
            comment=r.comment,
            created_at=aware(r.created_at).isoformat(),
        )
        for r in rows
    ]
