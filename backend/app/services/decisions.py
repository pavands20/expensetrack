"""Shared refusal of self-decisions (approve, reject, mark paid)."""

from fastapi import HTTPException

from app.models import Claim, User


def assert_not_submitter(claim: Claim, user: User) -> None:
    if claim.owner_id == user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
