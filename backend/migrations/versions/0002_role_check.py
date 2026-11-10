"""align the users.role check constraint with the Role enum

Revision ID: 0002
Revises: 0001

A database created by an earlier schema may carry a ck_users_role constraint that
rejects the current role values; replace it with one that matches them.
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role")
    op.execute(
        "ALTER TABLE users ADD CONSTRAINT ck_users_role "
        "CHECK (role IN ('Employee', 'Manager', 'Finance'))"
    )


def downgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role")
