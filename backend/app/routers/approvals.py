"""Claim submission and the approvals queue."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_auth
from app.models import Claim, ClaimLine, User, record_status_change, utcnow
from app.routers.claims import _out, _outs, _own_draft, _visible_claim
from app.schemas import ClaimOut, DecisionIn
from app.services.decisions import assert_not_submitter

router = APIRouter()


@router.post("/api/claims/{claim_id}/submit", response_model=ClaimOut)
def submit_claim(
    claim_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> ClaimOut:
    claim = _own_draft(db, claim_id, user, "Only draft claims can be submitted")
    lines = list(db.scalars(select(ClaimLine).where(ClaimLine.claim_id == claim.id)))
    if not lines:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "A claim needs at least one line before it can be submitted",
                "missing_receipt_line_ids": [],
            },
        )
    missing = sorted(ln.id for ln in lines if not ln.receipt_key)
    if missing:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Every line needs a receipt before the claim can be submitted",
                "missing_receipt_line_ids": missing,
            },
        )
    mgr = db.get(User, user.manager_id) if user.manager_id is not None else None
    new = "pending_manager" if mgr is not None and mgr.is_active else "pending_finance"
    record_status_change(db, claim, claim.status, new, user)
    claim.status = new
    claim.updated_at = utcnow()
    db.commit()
    return _out(db, claim)


@router.post("/api/claims/{claim_id}/decision", response_model=ClaimOut)
def decide_claim(
    claim_id: int,
    body: DecisionIn,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> ClaimOut:
    claim = _visible_claim(db, claim_id, user)
    assert_not_submitter(claim, user)
    if user.role not in ("Manager", "Finance"):
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.role == "Manager":
        owner = db.get(User, claim.owner_id)
        if owner is None or owner.manager_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    stage = "pending_manager" if user.role == "Manager" else "pending_finance"
    status = db.scalar(
        select(Claim.status)
        .where(Claim.id == claim.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if status != stage:
        raise HTTPException(status_code=409, detail="Claim is not awaiting your decision")
    comment = (body.comment or "").strip() or None
    if body.decision == "reject":
        if comment is None:
            raise HTTPException(status_code=422, detail="A comment is required to reject a claim")
        new = "draft"
    else:
        new = "pending_finance" if user.role == "Manager" else "approved"
    record_status_change(db, claim, stage, new, user, comment)
    claim.status = new
    claim.updated_at = utcnow()
    db.commit()
    return _out(db, claim)


@router.get("/api/approvals/queue", response_model=list[ClaimOut])
def queue(user: User = Depends(require_auth), db: Session = Depends(get_db)) -> list[ClaimOut]:
    if user.role == "Manager":
        q = (
            select(Claim)
            .join(User, User.id == Claim.owner_id)
            .where(
                Claim.status == "pending_manager",
                User.manager_id == user.id,
                Claim.owner_id != user.id,
            )
        )
    elif user.role == "Finance":
        q = select(Claim).where(Claim.status == "pending_finance", Claim.owner_id != user.id)
    else:
        raise HTTPException(status_code=403, detail="Forbidden")
    q = q.order_by(Claim.created_at.desc(), Claim.id.desc())
    return _outs(db, list(db.scalars(q)))
