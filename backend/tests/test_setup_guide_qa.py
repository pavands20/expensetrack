"""QA acceptance: setup and configuration guide (US-026), checked on the written docs."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _docs() -> dict[str, str]:
    files = [ROOT / "README.md", *sorted((ROOT / "docs").rglob("*.md"))]
    return {
        str(f.relative_to(ROOT)): f.read_text(encoding="utf-8", errors="ignore").lower()
        for f in files
        if f.exists() and f.name != "behaviour-rules.md"
    }


def _one_doc_has(*groups):
    """One document must cover every group; a group is a tuple of alternatives."""
    for text in _docs().values():
        if all(any(alt.lower() in text for alt in g) for g in groups):
            return True
    return False


def test_ac098_guide_covers_postgres_private_s3_ses_and_settings():
    assert _one_doc_has(
        ("postgresql",),
        ("database_url",),
        ("s3_bucket",),
        ("private",),
        ("block public access", "not public", "no public", "private bucket", "private s3"),
        ("ses",),
        ("verified",),
        ("sender domain", "sender identity", "verified sender"),
        ("aws_region",),
        ("aws credentials", "aws_access_key_id", "iam role", "credentials"),
        ("session_idle_minutes",),
        ("30",),
    )


def test_ac098_guide_gives_run_steps():
    assert _one_doc_has(
        ("alembic upgrade", "migrations", "migrate"),
        ("docker compose", "uvicorn"),
        ("bootstrap_admin_email",),
    )


def test_ac099_guide_explains_first_finance_user_and_initial_categories():
    assert _one_doc_has(
        ("bootstrap_admin_email",),
        ("bootstrap_admin_password",),
        ("first finance",),
        ("travel",),
        ("meals",),
        ("equipment",),
        ("other",),
        ("categories",),
        ("seed",),
    )


def test_ac100_guide_states_out_of_scope_items():
    assert _one_doc_has(
        ("currency conversion",),
        ("mileage",),
        ("card feed",),
        ("accounting integration",),
        ("not supported", "out of scope", "not in scope", "does not support"),
    )


def test_nfr008_nfr014_guide_names_london_region():
    # NFR-008 hosting/encryption is infrastructure; the guide must at least name the region.
    assert _one_doc_has(("eu-west-2", "london"), ("gdpr", "encrypt"))


def test_nfr014_user_guide_covers_roles_and_routing():
    text = (ROOT / "frontend/src/screens/Help.tsx").read_text(encoding="utf-8").lower()
    for term in ("employee", "manager", "finance", "approval routing"):
        assert term in text
