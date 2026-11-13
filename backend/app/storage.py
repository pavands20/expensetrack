"""Receipt object storage: private S3 when S3_BUCKET is set, else files under MEDIA_ROOT."""

import hashlib
import hmac
import os
import secrets
import time
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

EXPIRES_IN = 300
_FALLBACK_SECRET = secrets.token_bytes(32)  # only when no secret is configured (laptop)


def _bucket() -> str:
    return os.getenv("S3_BUCKET", "").strip()


@lru_cache(maxsize=4)
def _client(factory, region: str | None):
    from botocore.config import Config

    return factory(
        "s3",
        region_name=region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
    )


def _s3():
    import boto3

    return _client(boto3.client, os.getenv("AWS_REGION") or None)


def _secret() -> bytes:
    configured = os.getenv("JWT_SECRET_KEY", "")
    return configured.encode() if configured else _FALLBACK_SECRET


def _safe_key(key: str) -> str:
    parts = key.split("/")
    if not key or key.startswith("/") or "\\" in key or "\x00" in key or ".." in parts:
        raise ValueError("Invalid storage key")
    return key


def _owner() -> dict:
    owner = os.getenv("S3_BUCKET_OWNER", "").strip()
    return {"ExpectedBucketOwner": owner} if owner else {}


def _media_path(key: str) -> Path:
    key = _safe_key(key)
    root = Path(os.getenv("MEDIA_ROOT", "./media")).resolve()
    path = (root / key).resolve()
    if root not in path.parents:
        raise ValueError("Invalid storage key")
    return path


def put_object(key: str, data: bytes, content_type: str) -> None:
    key = _safe_key(key)
    if _bucket():
        _s3().put_object(Bucket=_bucket(), Key=key, Body=data, ContentType=content_type, **_owner())
        return
    path = _media_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _sign(key: str, exp: int) -> str:
    return hmac.new(_secret(), f"{key}:{exp}".encode(), hashlib.sha256).hexdigest()


def presign_get(key: str) -> tuple[str, int]:
    """A short-lived link: presigned S3 GET, or a signed API URL for MEDIA_ROOT."""
    if _bucket():
        url = _s3().generate_presigned_url(
            "get_object",
            Params={"Bucket": _bucket(), "Key": _safe_key(key), **_owner()},
            ExpiresIn=EXPIRES_IN,
        )
        return url, EXPIRES_IN
    exp = int(time.time()) + EXPIRES_IN
    return f"/api/claims/receipt-files/{quote(key)}?exp={exp}&sig={_sign(key, exp)}", EXPIRES_IN


def verify_local(key: str, exp: int, sig: str) -> bool:
    return exp >= time.time() and hmac.compare_digest(sig, _sign(key, exp))


def read_local(key: str) -> bytes | None:
    path = _media_path(key)
    return path.read_bytes() if path.is_file() else None


def delete_object(key: str) -> None:
    if _bucket():
        _s3().delete_object(Bucket=_bucket(), Key=_safe_key(key), **_owner())
        return
    _media_path(key).unlink(missing_ok=True)
