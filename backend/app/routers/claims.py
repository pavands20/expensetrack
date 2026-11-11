"""Draft claims and their lines."""

import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import storage
from app.database import get_db
from app.deps import require_auth
from app.models import Category, Claim, ClaimLine, User
from app.schemas import ClaimCreateIn, ClaimOut, LineIn, LineOut
from app.services.users import direct_reports

router = APIRouter(prefix="/api/claims")
logger = logging.getLogger(__name__)


def _out(db: Session, claim: Claim) -> ClaimOut:
    rows = db.execute(
        select(ClaimLine, Category)
        .join(Category, Category.id == ClaimLine.category_id)
        .where(ClaimLine.claim_id == claim.id)
        .order_by(ClaimLine.date, ClaimLine.id)
    ).all()
    total = sum((Decimal(ln.amount) for ln, _ in rows), Decimal("0"))
    owner = db.get(User, claim.owner_id)
    return ClaimOut(
        id=claim.id,
        reference=claim.reference,
        title=claim.title,
        status=claim.status,
        owner_id=claim.owner_id,
        owner_name=owner.name if owner else "",
        created_at=claim.created_at.isoformat(),
        lines=[
            LineOut(
                id=ln.id,
                date=ln.date.isoformat(),
                category_id=cat.id,
                category_name=cat.name,
                category_is_active=cat.is_active,
                amount_gbp=f"{Decimal(ln.amount):.2f}",
                description=ln.description,
            )
            for ln, cat in rows
        ],
        total_gbp=f"{total:.2f}",
    )


def _visible_claim(db: Session, claim_id: int, user: User) -> Claim:
    claim = db.get(Claim, claim_id)
    if claim is not None:
        if (
            claim.owner_id == user.id
            or user.role == "Finance"
            or claim.owner_id in {r.id for r in direct_reports(db, user.id)}
        ):
            return claim
    raise HTTPException(status_code=404, detail="Claim not found")


def _own_draft(db: Session, claim_id: int, user: User, message: str) -> Claim:
    claim = _visible_claim(db, claim_id, user)
    if claim.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if claim.status != "draft":
        raise HTTPException(status_code=409, detail=message)
    return claim


@router.post("", status_code=201, response_model=ClaimOut)
def create_claim(
    body: ClaimCreateIn, user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> ClaimOut:
    claim = Claim(owner_id=user.id, title=body.title or None, status="draft")
    db.add(claim)
    db.commit()
    return _out(db, claim)


@router.post("/{claim_id}/lines", status_code=201, response_model=ClaimOut)
def add_line(
    claim_id: int,
    body: LineIn,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> ClaimOut:
    claim = _own_draft(db, claim_id, user, "Only draft claims can be changed")
    cat = db.get(Category, body.category_id)
    if cat is None or not cat.is_active:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "category_id"],
                    "msg": "Unknown or retired category",
                    "type": "value_error",
                }
            ],
        )
    db.add(
        ClaimLine(
            claim_id=claim.id,
            date=body.date,
            category_id=cat.id,
            amount=body.amount_gbp,
            description=body.description,
        )
    )
    db.commit()
    return _out(db, claim)


@router.get("/{claim_id}", response_model=ClaimOut)
def get_claim(
    claim_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> ClaimOut:
    return _out(db, _visible_claim(db, claim_id, user))


@router.delete("/{claim_id}", status_code=204)
def delete_claim(
    claim_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> Response:
    claim = _own_draft(db, claim_id, user, "Only draft claims can be deleted")
    keys = [
        k
        for k in db.scalars(select(ClaimLine.receipt_key).where(ClaimLine.claim_id == claim.id))
        if k
    ]
    db.execute(delete(ClaimLine).where(ClaimLine.claim_id == claim.id))
    db.delete(claim)
    db.commit()
    for key in keys:
        try:
            storage.delete_object(key)
        except Exception:
            logger.exception("Failed to delete receipt object %r", key)
    return Response(status_code=204)
