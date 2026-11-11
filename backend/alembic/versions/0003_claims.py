"""claims and claim_lines

Revision ID: 0003
Revises: 0002
"""

import sqlalchemy as sa

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "claims",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(80), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "claim_lines",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "claim_id",
            sa.Integer,
            sa.ForeignKey("claims.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("description", sa.String(140), nullable=False),
        sa.Column("receipt_key", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("claim_lines")
    op.drop_table("claims")
