"""Draft claims and their lines."""

import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app import storage
from app.database import get_db
from app.deps import aware, require_auth
from app.models import Category, Claim, ClaimLine, ClaimStatusChange, User, utcnow
from app.schemas import ClaimCreateIn, ClaimOut, LineIn, LineOut, LinePatchIn, RejectionOut
from app.services.claims import visible_claims

router = APIRouter(prefix="/api/claims")
logger = logging.getLogger(__name__)


def _outs(db: Session, claims: list[Claim]) -> list[ClaimOut]:
    if not claims:
        return []
    rows = db.execute(
        select(ClaimLine, Category)
        .join(Category, Category.id == ClaimLine.category_id)
        .where(ClaimLine.claim_id.in_([c.id for c in claims]))
        .order_by(ClaimLine.date, ClaimLine.id)
    ).all()
    by_claim: dict[int, list] = {}
    for ln, cat in rows:
        by_claim.setdefault(ln.claim_id, []).append((ln, cat))
    owners = {
        u.id: u.name
        for u in db.scalars(select(User).where(User.id.in_({c.owner_id for c in claims})))
    }
    rejections: dict[int, RejectionOut] = {}
    drafts = [c.id for c in claims if c.status == "draft"]
    if drafts:
        for r in db.scalars(
            select(ClaimStatusChange)
            .where(
                ClaimStatusChange.claim_id.in_(drafts),
                ClaimStatusChange.new_status == "draft",
                ClaimStatusChange.old_status != "draft",
            )
            .order_by(ClaimStatusChange.created_at, ClaimStatusChange.id)
        ):
            rejections[r.claim_id] = RejectionOut(
                comment=r.comment or "",
                decided_by_name=r.actor_name,
                decided_at=aware(r.created_at).isoformat(),
            )
    result = []
    for claim in claims:
        pairs = by_claim.get(claim.id, [])
        total = sum((Decimal(ln.amount) for ln, _ in pairs), Decimal("0"))
        result.append(
            ClaimOut(
                id=claim.id,
                reference=claim.reference,
                title=claim.title,
                status=claim.status,
                owner_id=claim.owner_id,
                owner_name=owners.get(claim.owner_id, ""),
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
                        has_receipt=bool(ln.receipt_key),
                        over_limit=cat.limit_gbp is not None
                        and Decimal(ln.amount) > Decimal(cat.limit_gbp),
                    )
                    for ln, cat in pairs
                ],
                total_gbp=f"{total:.2f}",
                last_rejection=rejections.get(claim.id),
            )
        )
    return result


def _out(db: Session, claim: Claim) -> ClaimOut:
    return _outs(db, [claim])[0]


def _discard(key: str) -> None:
    try:
        storage.delete_object(key)
    except Exception:
        logger.exception("Failed to delete receipt object %r", key)


def _visible_claim(db: Session, claim_id: int, user: User) -> Claim:
    claim = db.scalar(visible_claims(db, user).where(Claim.id == claim_id))
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


def _own_draft(db: Session, claim_id: int, user: User, message: str) -> Claim:
    claim = _visible_claim(db, claim_id, user)
    if claim.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Row lock serialises concurrent edits and submits; status is read after the lock.
    status = db.scalar(
        select(Claim.status)
        .where(Claim.id == claim.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if status != "draft":
        raise HTTPException(status_code=409, detail=message)
    return claim


@router.get("", response_model=list[ClaimOut])
def list_claims(
    user: User = Depends(require_auth), db: Session = Depends(get_db)
) -> list[ClaimOut]:
    return _outs(db, list(db.scalars(visible_claims(db, user))))


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
    claim.updated_at = utcnow()
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


def _claim_line(db: Session, claim_id: int, line_id: int) -> ClaimLine:
    line = db.scalar(
        select(ClaimLine).where(ClaimLine.id == line_id, ClaimLine.claim_id == claim_id)
    )
    if line is None:
        raise HTTPException(status_code=404, detail="Line not found")
    return line


@router.patch("/{claim_id}/lines/{line_id}", response_model=ClaimOut)
def patch_line(
    claim_id: int,
    line_id: int,
    body: LinePatchIn,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> ClaimOut:
    claim = _own_draft(db, claim_id, user, "Only draft claims can be changed")
    line = _claim_line(db, claim_id, line_id)
    if body.category_id is not None and body.category_id != line.category_id:
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
        line.category_id = cat.id
    if body.date is not None:
        line.date = body.date
    if body.amount_gbp is not None:
        line.amount = body.amount_gbp
    if body.description is not None:
        line.description = body.description
    claim.updated_at = utcnow()
    db.commit()
    return _out(db, claim)


@router.delete("/{claim_id}/lines/{line_id}", response_model=ClaimOut)
def delete_line(
    claim_id: int,
    line_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> ClaimOut:
    claim = _own_draft(db, claim_id, user, "Only draft claims can be changed")
    line = _claim_line(db, claim_id, line_id)
    count = db.scalar(
        select(func.count()).select_from(ClaimLine).where(ClaimLine.claim_id == claim.id)
    )
    if count <= 1:
        raise HTTPException(status_code=409, detail="A claim needs at least one line")
    key = line.receipt_key
    db.delete(line)
    claim.updated_at = utcnow()
    db.commit()
    if key:
        _discard(key)
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
        _discard(key)
    return Response(status_code=204)
