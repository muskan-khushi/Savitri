"""
db.py

Async SQLAlchemy engine + session factory.

Production target: Postgres (Supabase), via DATABASE_URL env var, e.g.
    postgresql+asyncpg://user:pass@host:5432/postgres

Local dev fallback: if DATABASE_URL isn't set, we use a local SQLite
file (aiosqlite driver) so the ORM layer, models, and business logic
can be developed and tested without needing live network access to a
hosted Postgres instance.

IMPORTANT — this SQLite fallback is an engineering convenience for
local development, not a violation of zero-mock-logic: the *data*
stored is always real (real farm coordinates, real computed
recommendations). Only the storage engine differs between dev and
prod. Don't ship SQLite to production — Supabase/Postgres is required
for concurrent access, PostGIS (needed later for cold-storage
distance matching), and durability.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./savitri_dev.db")

# echo=False in prod; flip via env var if you need to debug SQL
engine = create_async_engine(DATABASE_URL, echo=os.environ.get("SQL_ECHO", "") == "1")

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """
    Create tables if they don't exist. Fine for this stage of the
    project; once schema starts changing across environments with real
    farmer data in it, replace this with proper Alembic migrations.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
