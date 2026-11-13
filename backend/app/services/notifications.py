"""Claim emails. Called after commit; never raises and never blocks the claim action."""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.email import send_email
from app.models import Claim, User

logger = logging.getLogger(__name__)

OUTCOMES = {"pending_finance": "approved by manager", "approved": "approved", "draft": "rejected"}


def _send(claim: Claim, recipients: list[User], subject: str, body: str) -> None:
    for u in recipients:
        try:
            send_email(u.email, subject, body)
        except Exception:
            # Log the claim reference only: no address, no body.
            logger.error("Failed to send notification email for claim %s", claim.reference)


def notify_approvers(db: Session, claim: Claim) -> None:
    """Email the approvers for the stage the claim has just reached."""
    try:
        owner = db.get(User, claim.owner_id)
        if owner is None:
            return
        if claim.status == "pending_manager":
            mgr = db.get(User, owner.manager_id) if owner.manager_id is not None else None
            people = [mgr] if mgr is not None and mgr.is_active else []
        elif claim.status == "pending_finance":
            people = list(
                db.scalars(
                    select(User).where(
                        User.role == "Finance", User.is_active.is_(True), User.id != owner.id
                    )
                )
            )
        else:
            return
        _send(
            claim,
            people,
            f"Claim {claim.reference} awaits your decision",
            f"Claim {claim.reference} is waiting for your approval.",
        )
    except Exception:
        logger.error("Failed to notify approvers for claim %s", claim.reference)


def notify_submitter(db: Session, claim: Claim, outcome: str, comment: str | None = None) -> None:
    """Email the claim's owner the outcome (and comment, if any)."""
    try:
        owner = db.get(User, claim.owner_id)
        if owner is None or not owner.is_active:
            return
        body = f"Claim {claim.reference}: {outcome}."
        if comment:
            body += f"\nComment: {comment}"
        _send(claim, [owner], f"Claim {claim.reference} {outcome}", body)
    except Exception:
        logger.error("Failed to notify submitter for claim %s", claim.reference)
