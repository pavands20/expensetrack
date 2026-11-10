from sqlalchemy import create_engine

from alembic import context
from app import models  # noqa: F401
from app.database import DATABASE_URL, Base

target_metadata = Base.metadata


def run_migrations_online() -> None:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        context.configure(connection=conn, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


run_migrations_online()
