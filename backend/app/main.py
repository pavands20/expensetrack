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

from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from alembic import command
from app import models  # noqa: F401 -- registers the tables
from app.auth import seed_initial_finance
from app.routers import auth as auth_router
from app.routers import users as users_router


def _alembic_config() -> Config:
    cfg = Config()
    cfg.set_main_option("script_location", str(Path(__file__).resolve().parent.parent / "alembic"))
    return cfg


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Apply Alembic migrations, then seed the initial Finance user."""
    command.upgrade(_alembic_config(), "head")
    seed_initial_finance()
    yield


app = FastAPI(
    title="ExpenseTrack",
    description=(
        "ExpenseTrack handles employee expense claims for a 5\u201350 person company. "
        "Roles: Employee, Manager, Finance. No self sign-up \u2014 Finance creates accounts "
        "and assigns each employee a manager. Sign-in: email and password, sign-out, and "
        "password reset by email. Claims: an employee creates a claim with one or more lines "
        "(date, category, amount in GBP, description), attaches a receipt image or PDF per "
        "line (up to 5 MB), and submits it. A draft can be edited; a submitted claim cannot. "
        "Approval: a manager approves or rejects their direct reports' submitted claims with "
        "a comment. Finance then approves or rejects manager-approved claims and marks "
        "approved ones paid. Nobody can approve their own claim. Categories: Finance manages "
        "categories (Travel, Meals, Equipment, Other), each with an optional per-line limit. "
        "Lines over the limit are flagged for the approver. Dashboard: employees see their "
        "claims by status. Finance sees totals by category and month, and can export approved "
        "claims as CSV. Out of scope: currency conversion, mileage, card feeds, accounting "
        "integrations. Stack: React, FastAPI, PostgreSQL, S3 for receipts, on AWS. "
        "English only.\n\n"
        "Claims submitted by a Manager or a Finance user are approved by their assigned "
        "manager, then Finance."
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
async def health() -> dict[str, str]:
    """Liveness probe, and the only route here that is not a stub."""
    return {"status": "ok"}
