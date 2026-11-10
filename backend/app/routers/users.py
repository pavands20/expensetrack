"""/api/users endpoints (Finance only)."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import hash_password, require_role, revoke_user_sessions
from app.database import get_db
from app.models import User
from app.schemas import UserOut

_finance = Depends(require_role("finance"))
router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[_finance])

Role = Literal["employee", "manager", "finance"]
DUPLICATE = "A user with this email already exists"


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    role: Role
    manager_id: int | None = None
    password: str = Field(min_length=8, max_length=256)


class UserPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: Role | None = None
    manager_id: int | None = None


def _check_manager(db: Session, manager_id: int | None, user_id: int | None) -> None:
    if manager_id is None:
        return
    if user_id is not None and manager_id == user_id:
        raise HTTPException(status_code=400, detail="A user cannot be their own manager")
    mgr = db.get(User, manager_id)
    if mgr is None or not mgr.is_active:
        raise HTTPException(status_code=400, detail="Manager must be an existing active user")


def _get(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)))


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)) -> User:
    email = str(body.email).strip().lower()
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise HTTPException(status_code=409, detail=DUPLICATE)
    _check_manager(db, body.manager_id, None)
    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        role=body.role,
        manager_id=body.manager_id,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=DUPLICATE) from None
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserPatch, db: Session = Depends(get_db)) -> User:
    user = _get(db, user_id)
    sent = body.model_fields_set
    if "manager_id" in sent:
        _check_manager(db, body.manager_id, user_id)
        user.manager_id = body.manager_id
    if "name" in sent and body.name is not None:
        user.name = body.name.strip()
    if "role" in sent and body.role is not None:
        user.role = body.role
    db.commit()
    return user


@router.post("/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    actor: User = _finance,
) -> User:
    if user_id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    user = _get(db, user_id)
    user.is_active = False
    revoke_user_sessions(db, user.id)  # commits the flag and the revocation together
    return user
