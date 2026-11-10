import pytest

from app.storage import LocalStorage, get_storage


def test_local_storage_round_trip(tmp_path) -> None:
    store = LocalStorage(str(tmp_path))
    store.put("claims/a/receipt.pdf", b"%PDF-1", "application/pdf")

    assert store.local_path("claims/a/receipt.pdf").read_bytes() == b"%PDF-1"
    url, _ = store.presigned_url("claims/a/receipt.pdf")
    assert url.endswith("claims/a/receipt.pdf")

    store.delete("claims/a/receipt.pdf")
    assert not store.local_path("claims/a/receipt.pdf").exists()


def test_local_storage_refuses_path_traversal(tmp_path) -> None:
    with pytest.raises(ValueError):
        LocalStorage(str(tmp_path)).put("../escape", b"x", "text/plain")


def test_get_storage_uses_media_root_without_a_bucket(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.setenv("MEDIA_ROOT", str(tmp_path))

    assert isinstance(get_storage(), LocalStorage)
