"""Pydantic request and response models."""

from pydantic import BaseModel, EmailStr, Field

from app.models import Role


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    manager_id: int | None
    manager_name: str | None
    is_active: bool


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    role: Role
    manager_id: int | None = None
    initial_password: str = Field(min_length=8, max_length=256)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: Role | None = None
    manager_id: int | None = None


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserOut
