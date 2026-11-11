"""Pydantic request and response models."""

import datetime as dt
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, model_validator


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: Literal["Employee", "Manager", "Finance"]
    manager_id: int | None
    is_active: bool


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=1024)


class LoginOut(BaseModel):
    token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut


class ResetRequestIn(BaseModel):
    email: EmailStr


class ResetConfirmIn(BaseModel):
    token: str = Field(min_length=1, max_length=512)
    new_password: str = Field(min_length=8, max_length=1024)


class MessageOut(BaseModel):
    message: str


Role = Literal["Employee", "Manager", "Finance"]


class UserCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    role: Role
    manager_id: int | None = None
    initial_password: str | None = Field(default=None, min_length=8, max_length=1024)


class UserPatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: Role | None = None
    manager_id: int | None = None


CategoryName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
Limit = Annotated[Decimal, Field(gt=0, max_digits=8, decimal_places=2)]


class ClaimCreateIn(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None


class LineIn(BaseModel):
    date: dt.date
    category_id: int
    amount_gbp: Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]
    description: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)
    ]


class LinePatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: dt.date | None = None
    category_id: int | None = None
    amount_gbp: Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)] | None = None
    description: (
        Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)]
        | None
    ) = None

    @model_validator(mode="after")
    def _at_least_one(self) -> "LinePatchIn":
        if all(getattr(self, f) is None for f in type(self).model_fields):
            raise ValueError("At least one field is required")
        return self


class LineOut(BaseModel):
    id: int
    date: str
    category_id: int
    category_name: str
    category_is_active: bool
    amount_gbp: str
    description: str
    has_receipt: bool = False


class ClaimOut(BaseModel):
    id: int
    reference: str
    title: str | None
    status: str
    owner_id: int
    owner_name: str
    created_at: str
    lines: list[LineOut]
    total_gbp: str


class CategoryOut(BaseModel):
    id: int
    name: str
    limit_gbp: str | None
    is_active: bool


class CategoryCreateIn(BaseModel):
    name: CategoryName
    limit_gbp: Limit | None = None


class CategoryPatchIn(BaseModel):
    name: CategoryName | None = None
    limit_gbp: Limit | None = None
    is_active: bool | None = None
