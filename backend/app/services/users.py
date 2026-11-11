"""User administration helpers."""

import os
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.email import send_email
from app.models import PasswordResetToken, User, UserSession, utcnow
from app.security import hash_token, new_token


def direct_reports(db: Session, manager_id: int) -> list[User]:
    """Users whose manager is `manager_id`.

    The manager is never copied onto claims. It is always resolved from the
    submitter's current users.manager_id, so changing it moves pending claims to
    the new manager's queue.
    """
    return list(db.scalars(select(User).where(User.manager_id == manager_id).order_by(User.name)))


def check_manager(db: Session, manager_id: int | None, user_id: int | None = None) -> None:
    if manager_id is None:
        return
    mgr = db.get(User, manager_id)
    if manager_id == user_id or mgr is None or not mgr.is_active:
        raise HTTPException(status_code=422, detail="Invalid manager")


def send_reset_email(db: Session, user: User) -> None:
    token = new_token()
    try:
        minutes = int(os.getenv("RESET_TOKEN_MINUTES", "60"))
    except ValueError:
        minutes = 60
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=utcnow() + timedelta(minutes=minutes),
        )
    )
    db.commit()
    base = os.getenv("FRONTEND_BASE_URL", "").strip()
    if not base:
        origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
        base = origins[0] if origins else "http://localhost:5173"
    send_email(
        user.email,
        "Set your password",
        f"Set your password: {base}/reset-password?token={token}",
    )


def revoke_access(db: Session, user_id: int) -> None:
    now = utcnow()
    db.execute(
        update(UserSession)
        .where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user_id, PasswordResetToken.used_at.is_(None))
        .values(used_at=now)
    )
