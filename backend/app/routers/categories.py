"""Finance-managed expense categories."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_auth, require_finance
from app.models import Category, User
from app.schemas import CategoryCreateIn, CategoryOut, CategoryPatchIn

router = APIRouter(prefix="/api/categories")

DUPLICATE = "A category with that name already exists"


def _out(c: Category) -> CategoryOut:
    limit = None if c.limit_gbp is None else f"{Decimal(c.limit_gbp):.2f}"
    return CategoryOut(id=c.id, name=c.name, limit_gbp=limit, is_active=c.is_active)


def _check_unique(db: Session, name: str, own_id: int | None = None) -> None:
    q = select(Category.id).where(func.lower(Category.name) == name.lower())
    if own_id is not None:
        q = q.where(Category.id != own_id)
    if db.scalar(q) is not None:
        raise HTTPException(status_code=409, detail=DUPLICATE)


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=DUPLICATE) from None


@router.get("", response_model=list[CategoryOut])
def list_categories(
    include_retired: bool = False,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    q = select(Category).order_by(Category.name, Category.id)
    if not (include_retired and user.role == "Finance"):
        q = q.where(Category.is_active.is_(True))
    return [_out(c) for c in db.scalars(q)]


@router.post(
    "", status_code=201, response_model=CategoryOut, dependencies=[Depends(require_finance)]
)
def create_category(body: CategoryCreateIn, db: Session = Depends(get_db)) -> CategoryOut:
    _check_unique(db, body.name)
    c = Category(name=body.name, limit_gbp=body.limit_gbp, is_active=True)
    db.add(c)
    _commit(db)
    return _out(c)


@router.patch("/{category_id}", response_model=CategoryOut, dependencies=[Depends(require_finance)])
def patch_category(
    category_id: int, body: CategoryPatchIn, db: Session = Depends(get_db)
) -> CategoryOut:
    c = db.get(Category, category_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Category not found")
    for field in ("name", "is_active"):
        if field in body.model_fields_set and getattr(body, field) is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be null")
    if body.name is not None:
        _check_unique(db, body.name, category_id)
        c.name = body.name
    if "limit_gbp" in body.model_fields_set:
        c.limit_gbp = body.limit_gbp
    if body.is_active is not None:
        c.is_active = body.is_active
    _commit(db)
    return _out(c)
