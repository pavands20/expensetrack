"""Finance marks an approved claim as paid. No payment is processed."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_auth
from app.models import User, record_status_change, utcnow
from app.routers.claims import _out, _visible_claim, locked_status
from app.schemas import ClaimOut
from app.services.decisions import assert_not_submitter
from app.services.notifications import notify_submitter

router = APIRouter()


@router.post("/api/claims/{claim_id}/mark-paid", response_model=ClaimOut)
def mark_paid(
    claim_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> ClaimOut:
    claim = _visible_claim(db, claim_id, user)
    if user.role != "Finance":
        raise HTTPException(status_code=403, detail="Forbidden")
    assert_not_submitter(claim, user)
    if locked_status(db, claim.id) != "approved":
        raise HTTPException(status_code=409, detail="Claim is not awaiting payment")
    record_status_change(db, claim, "approved", "paid", user)
    claim.status = "paid"
    claim.updated_at = utcnow()
    db.commit()
    notify_submitter(db, claim, "paid")
    return _out(db, claim)
