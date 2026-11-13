"""Receipt object storage: private S3 when S3_BUCKET is set, else files under MEDIA_ROOT."""

import hashlib
import hmac
import os
import secrets
import time
from pathlib import Path
from urllib.parse import quote

EXPIRES_IN = 300
_SECRET = secrets.token_bytes(32)  # per process: local links die on restart


def _bucket() -> str:
    return os.getenv("S3_BUCKET", "").strip()


def _s3():
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION") or None,
        config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
    )


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
        _s3().put_object(
            Bucket=_bucket(), Key=key, Body=data, ContentType=content_type, **_owner()
        )
        return
    path = _media_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _sign(key: str, exp: int) -> str:
    return hmac.new(_SECRET, f"{key}:{exp}".encode(), hashlib.sha256).hexdigest()


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
