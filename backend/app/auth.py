"""Password hashing, opaque server-side sessions and the auth dependencies."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app import config
from app.database import get_db
from app.models import Session, User

_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)
DUMMY_HASH = _hasher.hash("not-a-real-password")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(hashed: str, password: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except (VerificationError, InvalidHashError):
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: DbSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(Session(token_hash=hash_token(token), user_id=user.id))
    db.commit()
    return token


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _unauthorized() -> HTTPException:
    return HTTPException(401, "Not authenticated", headers={"WWW-Authenticate": "Bearer"})


def get_current_session(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: DbSession = Depends(get_db),
) -> Session:
    if creds is None or not creds.credentials:
        raise _unauthorized()
    session = db.scalar(select(Session).where(Session.token_hash == hash_token(creds.credentials)))
    if session is None or session.revoked_at is not None:
        raise _unauthorized()
    now = datetime.now(UTC)
    idle = timedelta(minutes=config.session_idle_minutes())
    if now - _aware(session.last_used_at) > idle:
        raise _unauthorized()
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        session.revoked_at = now
        db.commit()
        raise _unauthorized()
    session.last_used_at = now
    db.commit()
    return session


def get_current_user(
    session: Session = Depends(get_current_session), db: DbSession = Depends(get_db)
) -> User:
    user = db.get(User, session.user_id)
    if user is None:
        raise _unauthorized()
    return user


def require_role(*roles: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, "Forbidden")
        return user

    return dependency


def seed_bootstrap_user(db: DbSession) -> None:
    creds = config.bootstrap_finance()
    if creds is None or db.scalar(select(User.id).limit(1)) is not None:
        return
    email, password = creds
    db.add(
        User(
            name="Finance",
            email=email.strip().lower(),
            password_hash=hash_password(password),
            role="finance",
        )
    )
    db.commit()
