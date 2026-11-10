"""Alembic environment: uses the application's own engine and models."""

from alembic import context

from app import models  # noqa: F401 -- registers the tables
from app.database import Base, engine

target_metadata = Base.metadata


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
        connection.commit()


run_migrations_online()
