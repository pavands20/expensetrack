"""Application entrypoint.

Generated from the approved architecture: one router per component that owns
endpoints, one route per endpoint the API spec declares. Every generated route
is a stub that returns a typed placeholder, so the service starts, serves its
OpenAPI document and passes its tests before a single handler is implemented.
"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 -- imported so the tables register
from app.auth import seed_first_admin
from app.database import SessionLocal
from app.routers import auth as auth_router
from app.routers import users as users_router

_BACKEND = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Run Alembic migrations, then seed the first admin when configured.

    Runs on startup and not at import, so importing the application never opens a
    connection.
    """
    cfg = Config(str(_BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(_BACKEND / "migrations"))
    command.upgrade(cfg, "head")
    with SessionLocal() as db:
        seed_first_admin(db)
    yield


app = FastAPI(
    title="ExpenseTrack",
    description=(
        "ExpenseTrack handles employee expense claims for a 5\u201350 person company. "
        "Roles: Employee, Manager, Finance. No self sign-up \u2014 Finance creates "
        "accounts and assigns each employee a manager. Sign-in: email and password, "
        "sign-out, and password reset by email. Claims: an employee creates a claim "
        "with one or more lines, attaches a receipt per line (up to 5 MB), and submits "
        "it. Approval: the assigned manager, then Finance. Nobody can approve their "
        "own claim. Managers and Finance staff are approved by the assigned manager, "
        "then Finance."
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


app.include_router(auth_router.router)
app.include_router(users_router.router)


@app.get("/health")
@app.get("/api/healthz")
async def health() -> dict[str, str]:
    """Liveness probe, and the only route here that is not a stub."""
    return {"status": "ok"}
