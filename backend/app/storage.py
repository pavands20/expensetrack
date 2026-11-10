"""Receipt file storage behind one small interface with two backends.

S3 when `S3_BUCKET` is set (private objects, short-lived presigned GET links, default
credentials, no keys or endpoints passed); otherwise files under `MEDIA_ROOT`, which the
API serves itself through `local_path`.
"""

from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Protocol

from app import config

PRESIGN_SECONDS = 300  # receipts links expire after 5 minutes


class Storage(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> None: ...

    def delete(self, key: str) -> None: ...

    def presigned_url(self, key: str, expires_in: int = PRESIGN_SECONDS) -> tuple[str, datetime]:
        """A link to read the object and the moment it stops working."""
        ...


class LocalStorage:
    def __init__(self, root: str) -> None:
        self.root = Path(root).resolve()

    def local_path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if self.root != path and self.root not in path.parents:
            raise ValueError("storage key escapes the media root")
        return path

    def put(self, key: str, data: bytes, content_type: str) -> None:
        path = self.local_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> None:
        self.local_path(key).unlink(missing_ok=True)

    def presigned_url(self, key: str, expires_in: int = PRESIGN_SECONDS) -> tuple[str, datetime]:
        # The route that serves this path belongs to the receipts ticket.
        expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
        return f"/api/media/{key}", expires_at


class S3Storage:
    def __init__(self, bucket: str, region: str | None) -> None:
        import boto3

        self.bucket = bucket
        self.client = boto3.client("s3", region_name=region)

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def presigned_url(self, key: str, expires_in: int = PRESIGN_SECONDS) -> tuple[str, datetime]:
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )
        return url, datetime.now(UTC) + timedelta(seconds=expires_in)


def get_storage() -> Storage:
    """The backend the environment selects. Override this dependency in tests if needed."""
    bucket = config.s3_bucket()
    if bucket:
        return S3Storage(bucket, config.aws_region())
    return LocalStorage(config.media_root())
