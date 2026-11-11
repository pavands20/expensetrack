"""Receipt object storage: private S3 when S3_BUCKET is set, else files under MEDIA_ROOT."""

import os
from pathlib import Path


def _bucket() -> str:
    return os.getenv("S3_BUCKET", "").strip()


def _media_path(key: str) -> Path:
    root = Path(os.getenv("MEDIA_ROOT", "./media")).resolve()
    path = (root / key).resolve()
    if root not in path.parents:
        raise ValueError("Invalid storage key")
    return path


def delete_object(key: str) -> None:
    bucket = _bucket()
    if bucket:
        import boto3

        client = boto3.client("s3", region_name=os.getenv("AWS_REGION") or None)
        client.delete_object(Bucket=bucket, Key=key)
        return
    _media_path(key).unlink(missing_ok=True)
