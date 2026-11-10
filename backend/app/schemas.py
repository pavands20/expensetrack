"""Pydantic response models."""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: Literal["employee", "manager", "finance"]
    manager_id: int | None
    is_active: bool
