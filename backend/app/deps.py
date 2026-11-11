"""Authentication dependencies."""

import os
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserSession, utcnow
from app.security import hash_token

_bearer = HTTPBearer(auto_error=False)


def idle_minutes() -> int:
    try:
        return int(os.getenv("SESSION_IDLE_MINUTES", "30"))
    except ValueError:
        return 30


def aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _unauthorized() -> HTTPException:
    return HTTPException(status_code=401, detail="Not authenticated")


def _authenticated(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> tuple[UserSession, User]:
    if creds is None or not creds.credentials:
        raise _unauthorized()
    session = db.scalar(
        select(UserSession).where(UserSession.token_hash == hash_token(creds.credentials))
    )
    if session is None or session.revoked_at is not None:
        raise _unauthorized()
    now = utcnow()
    if aware(session.last_seen_at) + timedelta(minutes=idle_minutes()) < now:
        raise _unauthorized()
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        session.revoked_at = now
        db.commit()
        raise _unauthorized()
    session.last_seen_at = now
    db.commit()
    return session, user


def current_session(auth: tuple[UserSession, User] = Depends(_authenticated)) -> UserSession:
    return auth[0]


def require_auth(auth: tuple[UserSession, User] = Depends(_authenticated)) -> User:
    return auth[1]


def require_finance(user: User = Depends(require_auth)) -> User:
    if user.role != "Finance":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user
