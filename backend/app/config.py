"""Settings the platform provides as environment variables, each with a local default.

Read at call time, not import time, so a test can change the environment and see it.
"""

import os


def allowed_origins() -> list[str]:
    """The SPA's origin(s) for CORS; the Vite dev server when unset."""
    raw = os.getenv("ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:5173", "http://127.0.0.1:5173"]


def secret_key() -> str:
    """The shared API bearer the frontend sends. Public: never sign anything with it."""
    return os.getenv("SECRET_KEY", "dev-shared-bearer")


def jwt_secret_key() -> str:
    """Private signing secret for tokens and sessions."""
    return os.getenv("JWT_SECRET_KEY", "dev-only-private-signing-key")


def media_root() -> str:
    """Writable directory that survives redeploys (local receipt storage)."""
    return os.getenv("MEDIA_ROOT", "./media")


def s3_bucket() -> str | None:
    """The receipt bucket; unset means files go under MEDIA_ROOT."""
    return os.getenv("S3_BUCKET") or None


def aws_region() -> str | None:
    return os.getenv("AWS_REGION") or None


def bootstrap_admin() -> tuple[str, str] | None:
    """The first Finance user's credentials, or None (local runs, tests): seed nothing."""
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL")
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD")
    if email and password:
        return email, password
    return None
