"""SQLAlchemy models. Portable types only so SQLite test databases work."""

import datetime as dt
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

__all__ = [
    "Base",
    "Category",
    "Claim",
    "ClaimLine",
    "PasswordResetToken",
    "User",
    "UserSession",
    "utcnow",
]


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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UserSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    limit_gbp: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


Index("uq_categories_name_lower", func.lower(Category.name), unique=True)
