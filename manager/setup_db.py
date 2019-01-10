"""Set up Postgres and SQLAlchemy."""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base

uri = f'postgresql://{os.environ["POSTGRES_USER"]}:{os.environ["POSTGRES_PASSWORD"]}@{os.environ["POSTGRES_HOST"]}:{os.environ["POSTGRES_PORT"]}/{os.environ["POSTGRES_DB"]}'
engine = create_engine(uri, convert_unicode=True)
Base = declarative_base()
# db_session = scoped_session(sessionmaker(bind=engine))
db_session = sessionmaker(bind=engine)
db_scoped_session = scoped_session(db_session)
Base.query = db_scoped_session.query_property()  # What does this do?
Base.metadata.bind = engine


def init_db():
    """Initialize database tables."""
    # import all modules here that might define models so that
    # they will be registered properly on the metadata.  Otherwise
    # you will have to import them first before calling init_db()
    import manager.tables
    import manager.user
    import manager.feedback
    import manager.task
    engine.execute('CREATE SCHEMA IF NOT EXISTS private')
    Base.metadata.create_all(bind=engine)


@contextmanager
def session_scope():
    """Handle SQLAlchemy session lifecycle."""
    session = db_session()
    try:
        yield session
        # leave and come back here
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
