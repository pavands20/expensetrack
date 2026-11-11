"""Receipt upload and short-lived download links."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import storage
from app.database import get_db
from app.deps import require_auth
from app.models import ClaimLine, User, utcnow
from app.routers.claims import _out, _own_draft, _visible_claim
from app.schemas import ClaimOut

router = APIRouter(prefix="/api/claims")
logger = logging.getLogger(__name__)

MAX_BYTES = 5 * 1024 * 1024
REJECTED = "Receipts must be JPEG, PNG or PDF files of 5 MB or less."
TYPES = {"image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf"}
MAGIC = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "application/pdf": b"%PDF-",
}


def _line(db: Session, claim_id: int, line_id: int) -> ClaimLine:
    line = db.scalar(
        select(ClaimLine).where(ClaimLine.id == line_id, ClaimLine.claim_id == claim_id)
    )
    if line is None:
        raise HTTPException(status_code=404, detail="Line not found")
    return line


def _discard(key: str) -> None:
    try:
        storage.delete_object(key)
    except Exception:
        logger.exception("Failed to delete receipt object %r", key)


@router.put("/{claim_id}/lines/{line_id}/receipt", response_model=ClaimOut)
def put_receipt(
    claim_id: int,
    line_id: int,
    file: UploadFile,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> ClaimOut:
    claim = _own_draft(db, claim_id, user, "Only draft claims can be changed")
    line = _line(db, claim_id, line_id)
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=REJECTED)
    ctype = (file.content_type or "").split(";")[0].strip().lower()
    if ctype not in TYPES or not data.startswith(MAGIC[ctype]):
        raise HTTPException(status_code=415, detail=REJECTED)
    key = f"receipts/{claim.id}/{line.id}/{uuid.uuid4()}.{TYPES[ctype]}"
    storage.put_object(key, data, ctype)
    old = line.receipt_key
    line.receipt_key = key
    claim.updated_at = utcnow()
    try:
        db.commit()
    except Exception:
        db.rollback()
        _discard(key)
        raise
    if old:
        _discard(old)
    return _out(db, claim)


@router.get("/{claim_id}/lines/{line_id}/receipt-url")
def receipt_url(
    claim_id: int,
    line_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
) -> dict[str, str | int]:
    _visible_claim(db, claim_id, user)
    line = _line(db, claim_id, line_id)
    if not line.receipt_key:
        raise HTTPException(status_code=404, detail="Receipt not found")
    url, expires = storage.presign_get(line.receipt_key)
    return {"url": url, "expires_in": expires}


@router.get("/receipt-files/{key:path}", include_in_schema=False)
def receipt_file(key: str, exp: int = 0, sig: str = "") -> Response:
    if storage._bucket() or not storage.verify_local(key, exp, sig):
        raise HTTPException(status_code=404, detail="Not found")
    data = storage.read_local(key)
    if data is None:
        raise HTTPException(status_code=404, detail="Not found")
    media = {v: k for k, v in TYPES.items()}.get(key.rsplit(".", 1)[-1], "application/octet-stream")
    return Response(data, media_type=media, headers={"Cache-Control": "private, no-store"})
