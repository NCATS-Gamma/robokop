"""Set up Postgres and SQLAlchemy."""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from flask_sqlalchemy import SQLAlchemy

from manager.setup import app

uri = f'postgresql://{os.environ["POSTGRES_USER"]}:{os.environ["POSTGRES_PASSWORD"]}@{os.environ["POSTGRES_HOST"]}:{os.environ["POSTGRES_PORT"]}/{os.environ["POSTGRES_DB"]}'

app.config['SQLALCHEMY_DATABASE_URI'] = uri
db = SQLAlchemy(app)
Base = db.Model

engine = create_engine(uri, convert_unicode=True)
Session = sessionmaker(bind=engine)


def init_db():
    """Initialize database tables."""
    # import all modules here that might define models so that
    # they will be registered properly on the metadata.  Otherwise
    # you will have to import them first before calling init_db()
    import manager.tables
    import manager.user
    import manager.feedback
    import manager.task
    db.create_all()

@contextmanager
def session_scope():
    """Handle SQLAlchemy session lifecycle."""
    session = Session()
    try:
        yield session
        # leave and come back here
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
