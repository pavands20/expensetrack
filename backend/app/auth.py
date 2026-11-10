"""Password hashing, opaque-token sessions and the auth dependencies."""

import hashlib
import os
import secrets
from datetime import timedelta

from argon2 import PasswordHasher
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import database
from app.database import get_db
from app.models import AuthSession, User, utcnow

_hasher = PasswordHasher()  # Argon2id by default
_bearer = HTTPBearer(auto_error=False)
DUMMY_HASH = _hasher.hash("not-a-real-password")


def idle_minutes() -> int:
    return int(os.getenv("SESSION_IDLE_MINUTES", "30"))


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except Exception:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(user_id=user.id, token_hash=hash_token(token)))
    db.commit()
    return token


def revoke_user_sessions(db: Session, user_id: int) -> None:
    db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )
    db.commit()


def _unauthorized() -> HTTPException:
    return HTTPException(status_code=401, detail="Not authenticated")


def get_current_session(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> AuthSession:
    if creds is None or not creds.credentials:
        raise _unauthorized()
    sess = db.scalar(
        select(AuthSession).where(AuthSession.token_hash == hash_token(creds.credentials))
    )
    if sess is None or sess.revoked_at is not None:
        raise _unauthorized()
    now = utcnow()
    if now - sess.last_used_at > timedelta(minutes=idle_minutes()):
        sess.revoked_at = now
        db.commit()
        raise _unauthorized()
    user = db.get(User, sess.user_id)
    if user is None or not user.is_active:
        sess.revoked_at = now
        db.commit()
        raise _unauthorized()
    sess.last_used_at = now
    db.commit()
    return sess


def get_current_user(
    sess: AuthSession = Depends(get_current_session), db: Session = Depends(get_db)
) -> User:
    user = db.get(User, sess.user_id)
    if user is None:
        raise _unauthorized()
    return user


def require_role(*roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return checker


def seed_initial_finance() -> None:
    email = os.getenv("INITIAL_FINANCE_EMAIL", "").strip().lower()
    name = os.getenv("INITIAL_FINANCE_NAME", "").strip()
    password = os.getenv("INITIAL_FINANCE_PASSWORD", "")
    if not (email and name and password):
        return
    with database.SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)) is None:
            db.add(
                User(
                    name=name,
                    email=email,
                    password_hash=hash_password(password),
                    role="finance",
                    is_active=True,
                )
            )
            db.commit()
