"""Finance-only user administration."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_finance
from app.models import User
from app.schemas import UserCreateIn, UserOut, UserPatchIn
from app.security import hash_password, new_token
from app.services.users import check_manager, revoke_access, send_reset_email

router = APIRouter(prefix="/api/users", dependencies=[Depends(require_finance)])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.name, User.id)))


@router.post("", status_code=201, response_model=UserOut)
def create_user(body: UserCreateIn, db: Session = Depends(get_db)) -> User:
    email = body.email.lower()
    if db.scalar(select(User).where(func.lower(User.email) == email)) is not None:
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    check_manager(db, body.manager_id)
    # Without an initial password the stored hash is of a random secret nobody knows.
    user = User(
        name=body.name,
        email=email,
        password_hash=hash_password(body.initial_password or new_token()),
        role=body.role,
        manager_id=body.manager_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    if body.initial_password is None:
        send_reset_email(db, user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def patch_user(user_id: int, body: UserPatchIn, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if "manager_id" in body.model_fields_set:
        check_manager(db, body.manager_id, user_id)
        user.manager_id = body.manager_id
    if body.name is not None:
        user.name = body.name
    if body.role is not None:
        user.role = body.role
    db.commit()
    return user


@router.post("/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int, caller: User = Depends(require_finance), db: Session = Depends(get_db)
) -> User:
    if caller.id == user_id:
        raise HTTPException(status_code=409, detail="You cannot deactivate your own account")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    revoke_access(db, user.id)
    db.commit()
    return user
