"""SQLAlchemy models. Portable types only so SQLite test databases work."""

import datetime as dt
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    event,
    func,
    true,
)
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.types import DateTime, TypeDecorator

from app.database import Base

__all__ = [
    "Base",
    "Category",
    "Claim",
    "ClaimLine",
    "ClaimStatusChange",
    "PasswordResetToken",
    "record_status_change",
    "User",
    "UserSession",
    "utcnow",
]


class UTCDateTime(TypeDecorator):
    """Timezone-aware UTC datetimes, even on SQLite which drops the zone."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_result_value(self, value, dialect):
        return value if value is None or value.tzinfo else value.replace(tzinfo=UTC)


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320), unique=True)  # stored lowercased
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


class UserSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime())
    used_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    limit_gbp: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, onupdate=utcnow)

    @property
    def reference(self) -> str:
        return f"EXP-{self.id:04d}"


class ClaimLine(Base):
    __tablename__ = "claim_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    claim_id: Mapped[int] = mapped_column(ForeignKey("claims.id", ondelete="CASCADE"), index=True)
    date: Mapped[dt.date] = mapped_column(Date)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    description: Mapped[str] = mapped_column(String(140))
    receipt_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


class ClaimStatusChange(Base):
    """Append-only audit entry. claim_id is deliberately not a foreign key."""

    __tablename__ = "claim_status_changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    claim_id: Mapped[int] = mapped_column(Integer, index=True)
    old_status: Mapped[str] = mapped_column(String(20))
    new_status: Mapped[str] = mapped_column(String(20))
    actor_id: Mapped[int] = mapped_column(Integer)
    actor_name: Mapped[str] = mapped_column(String(200))
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


def _refuse(*_args) -> None:
    raise RuntimeError("Audit entries cannot be changed or deleted")


event.listen(ClaimStatusChange, "before_update", _refuse)
event.listen(ClaimStatusChange, "before_delete", _refuse)


def record_status_change(
    db: Session, claim: Claim, old: str, new: str, actor: User, comment: str | None = None
) -> ClaimStatusChange:
    """Add an audit entry to the session; the caller commits with the status change."""
    entry = ClaimStatusChange(
        claim_id=claim.id,
        old_status=old,
        new_status=new,
        actor_id=actor.id,
        actor_name=actor.name,
        comment=comment,
    )
    db.add(entry)
    return entry


Index("uq_categories_name_lower", func.lower(Category.name), unique=True)
