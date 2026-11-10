"""Password hashing, opaque-token sessions and the dependencies other routers reuse.

Password reset (US-007) must refuse inactive users and call revoke_user_sessions.
"""

import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as DbSession

from app.database import get_db
from app.models import Role, Session, User

_hasher = PasswordHasher()  # Argon2id
_bearer = HTTPBearer(auto_error=False)
# Verified against when the email is unknown, so timing does not reveal accounts.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def burn_verify(password: str) -> None:
    verify_password(_DUMMY_HASH, password)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def idle_minutes() -> int:
    try:
        return int(os.getenv("SESSION_IDLE_MINUTES", "30"))
    except ValueError:
        return 30


def create_session(db: DbSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(Session(user_id=user.id, token_hash=hash_token(token)))
    db.commit()
    return token


def revoke_user_sessions(db: DbSession, user_id: int) -> None:
    db.execute(delete(Session).where(Session.user_id == user_id))
    db.commit()


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"}
    )


def get_current_session(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: DbSession = Depends(get_db),
) -> Session:
    if creds is None or not creds.credentials:
        raise _unauthorized()
    session = db.scalar(select(Session).where(Session.token_hash == hash_token(creds.credentials)))
    if session is None:
        raise _unauthorized()
    now = datetime.now(UTC)
    seen = session.last_seen_at
    if seen.tzinfo is None:
        seen = seen.replace(tzinfo=UTC)
    if now - seen > timedelta(minutes=idle_minutes()):
        db.delete(session)
        db.commit()
        raise _unauthorized()
    session.last_seen_at = now
    db.commit()
    return session


def get_current_user(
    session: Session = Depends(get_current_session),
    db: DbSession = Depends(get_db),
) -> User:
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise _unauthorized()
    return user


def require_role(*roles: Role):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return dependency


def seed_first_admin(db: DbSession) -> None:
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not email or not password:
        return
    if db.scalar(select(User).where(User.email == email)) is not None:
        return
    db.add(
        User(
            name="Administrator",
            email=email,
            password_hash=hash_password(password),
            role=Role.Finance,
            is_active=True,
        )
    )
    db.commit()
