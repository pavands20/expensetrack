"""Which claims a user may see."""

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models import Claim, User


def visible_owner_ids(db: Session, user: User) -> set[int] | None:
    """Owner ids whose claims `user` may see; None means everyone (Finance)."""
    if user.role == "Finance":
        return None
    ids = {user.id}
    if user.role == "Manager":
        # Direct reports stay visible whether or not they are active.
        ids.update(db.scalars(select(User.id).where(User.manager_id == user.id)))
    return ids


def visible_claims(db: Session, user: User) -> Select:
    q = select(Claim)
    ids = visible_owner_ids(db, user)
    if ids is not None:
        q = q.where(Claim.owner_id.in_(ids))
    return q.order_by(Claim.created_at.desc(), Claim.id.desc())
