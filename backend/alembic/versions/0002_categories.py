"""categories

Revision ID: 0002
Revises: 0001
"""

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("limit_gbp", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("uq_categories_name_lower", "categories", [sa.text("lower(name)")], unique=True)


def downgrade() -> None:
    op.drop_index("uq_categories_name_lower", table_name="categories")
    op.drop_table("categories")
