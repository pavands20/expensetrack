"""Alembic environment: uses the application's own engine and metadata."""

import sys
from pathlib import Path

# The alembic CLI does not put the backend directory on sys.path, so `import app` fails.
_BACKEND = str(Path(__file__).resolve().parent.parent)
if _BACKEND not in sys.path:
    sys.path.append(_BACKEND)

from alembic import context  # noqa: E402
from app import models  # noqa: E402, F401
from app.database import Base, engine  # noqa: E402

target_metadata = Base.metadata


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
        connection.commit()


run_migrations_online()
