"""Category seeding."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Category

DEFAULT_CATEGORIES = ["Travel", "Meals", "Equipment", "Other"]


def seed_categories(db: Session | None = None) -> None:
    """Create the default categories on first set-up only; never touches later edits."""
    if db is None:
        with SessionLocal() as own:
            seed_categories(own)
        return
    if db.scalar(select(Category.id).limit(1)) is not None:
        return
    for name in DEFAULT_CATEGORIES:
        db.add(Category(name=name, limit_gbp=None, is_active=True))
    db.commit()
