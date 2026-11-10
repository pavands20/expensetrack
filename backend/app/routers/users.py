"""Finance-only user administration. Users are never hard-deleted (NFR-011).

Manager assignment lives only in users.manager_id -- there is no per-claim copy -- so
claim visibility and approval queues must resolve through the submitter's *current*
manager_id. Deactivating a manager leaves their reports' manager_id unchanged until
Finance reassigns them.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession

from app.auth import hash_password, require_role, revoke_user_sessions
from app.database import get_db
from app.models import Role, User
from app.routers.auth import user_out
from app.schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(
    prefix="/api/users", tags=["users"], dependencies=[Depends(require_role(Role.Finance))]
)


def _check_manager(db: DbSession, manager_id: int | None, user_id: int | None) -> None:
    if manager_id is None:
        return
    if user_id is not None and manager_id == user_id:
        raise HTTPException(status_code=422, detail="A user cannot be their own manager")
    manager = db.get(User, manager_id)
    if manager is None:
        raise HTTPException(status_code=422, detail="Manager does not exist")
    if not manager.is_active:
        raise HTTPException(status_code=422, detail="Manager is inactive")


@router.get("", response_model=list[UserOut])
def list_users(db: DbSession = Depends(get_db)) -> list[UserOut]:
    users = db.scalars(select(User).order_by(User.name, User.id)).all()
    return [user_out(db, u) for u in users]


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: DbSession = Depends(get_db)) -> UserOut:
    email = str(body.email).strip().lower()
    dup = HTTPException(status_code=409, detail="A user with this email already exists")
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise dup
    _check_manager(db, body.manager_id, None)
    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.initial_password),
        role=body.role,
        manager_id=body.manager_id,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise dup from None
    return user_out(db, user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: DbSession = Depends(get_db)) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if "manager_id" in body.model_fields_set:
        _check_manager(db, body.manager_id, user.id)
        user.manager_id = body.manager_id
    if body.name is not None:
        user.name = body.name.strip()
    if body.role is not None:
        user.role = body.role
    db.commit()
    return user_out(db, user)


@router.post("/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int,
    actor: User = Depends(require_role(Role.Finance)),
    db: DbSession = Depends(get_db),
) -> UserOut:
    if actor.id == user_id:
        raise HTTPException(status_code=409, detail="You cannot deactivate your own account")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    revoke_user_sessions(db, user.id)
    return user_out(db, user)
