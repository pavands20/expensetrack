"""Test fixtures: real PostgreSQL (DATABASE_URL), one private schema per test."""

import os
import uuid
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401 -- imported so the tables register before create_all
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def db_session() -> Iterator[Session]:
    """An empty schema in the real database, dropped after the test."""
    url = os.environ["DATABASE_URL"]
    if not url.startswith("postgresql"):
        # DATABASE_URL is not PostgreSQL here: isolate on a private in-memory SQLite.
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            future=True,
        )
        Base.metadata.create_all(bind=engine)
        session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
        try:
            yield session
        finally:
            session.close()
            engine.dispose()
        return
    schema = "t_" + uuid.uuid4().hex
    admin = create_engine(url, future=True)
    with admin.begin() as c:
        c.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"}, future=True)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
        with admin.begin() as c:
            c.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()


@pytest.fixture
def client(db_session: Session) -> Iterator[TestClient]:
    """The application, talking to this test's database and nothing else."""

    def _get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = _get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
