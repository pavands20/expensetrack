"""Application entrypoint.

One router per component that owns endpoints (auth, users, categories,
claims), plus the /health liveness probe.
"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from alembic import command
from app import models  # noqa: F401 -- imported so the tables register
from app.database import SessionLocal
from app.models import User
from app.routers import approvals, auth, categories, claims, history, payments, receipts, users
from app.security import hash_password
from app.services.categories import seed_categories

_BACKEND = Path(__file__).resolve().parent.parent


def _seed_admin() -> None:
    """Create the first Finance user from the bootstrap settings, once."""
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not email or not password:
        return
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)) is None:
            db.add(
                User(
                    name="Finance Admin",
                    email=email,
                    password_hash=hash_password(password),
                    role="Finance",
                    is_active=True,
                )
            )
            db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Migrate to head, then seed. Runs on startup, never at import."""
    cfg = Config(str(_BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(_BACKEND / "alembic"))
    command.upgrade(cfg, "head")
    _seed_admin()
    seed_categories()
    yield


app = FastAPI(
    title="ExpenseTrack",
    description=(
        "ExpenseTrack handles employee expense claims for a 5\u201350 person company. "
        "Roles: Employee, Manager, Finance. No self sign-up \u2014 Finance creates accounts "
        "and assigns each employee a manager. Claims have lines with receipts; managers "
        "approve their direct reports' claims, then Finance approves and marks them paid. "
        "Nobody can approve their own claim. Stack: React, FastAPI, PostgreSQL, S3."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# The SPA runs on a different origin than the API, so the browser refuses its calls
# unless that origin is allowed here. In development that is the Vite dev server; when
# deployed, the platform injects the frontend's real URL as ALLOWED_ORIGINS (comma
# separated). Point ALLOWED_ORIGINS at the real thing and nothing else has to change.
_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins or _dev_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(claims.router)
app.include_router(receipts.router)
app.include_router(approvals.router)
app.include_router(history.router)
app.include_router(payments.router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
