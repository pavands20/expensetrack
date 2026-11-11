"""Pydantic request and response models."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
