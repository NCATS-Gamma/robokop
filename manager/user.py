"""Define users and roles."""

from flask_security import UserMixin, RoleMixin
from sqlalchemy.orm import relationship, backref
from sqlalchemy import Boolean, DateTime, Column, Integer, \
                       String, ForeignKeyConstraint
from manager.setup_db import Base, session_scope


class RolesUsers(Base):
    """Define correpondence table between users and roles."""

    __tablename__ = 'roles_users'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['private.user.id']),
        ForeignKeyConstraint(['role_id'], ['private.role.id']),
        {'schema': 'private'},
    )
    id = Column(Integer, primary_key=True)
    user_id = Column('user_id', Integer)
    role_id = Column('role_id', Integer)


class Role(Base, RoleMixin):
    """Role class."""

    __tablename__ = 'role'
    __table_args__ = (
        {'schema': 'private'},
    )
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)


class User(Base, UserMixin):
    """User class."""

    __tablename__ = 'user'
    __table_args__ = (
        {'schema': 'private'},
    )
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    username = Column(String)
    password = Column(String)
    last_login_at = Column(DateTime)
    current_login_at = Column(DateTime)
    last_login_ip = Column(String)
    current_login_ip = Column(String)
    login_count = Column(Integer)
    active = Column(Boolean)
    confirmed_at = Column(DateTime)
    roles = relationship(
        'Role', secondary='private.roles_users',
        backref=backref('users', lazy='dynamic')
    )

    def to_json(self):
        """Generate json representation of user."""
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key: getattr(self, key) for key in keys}
        return struct


def get_user_by_id(uid, session=None):
    """Get user by id."""
    
    with session_scope() as session:
        return session.query(User)\
            .filter(User.id == uid)\
            .first().to_json()


def list_users(session=None):
    """Get a list of all users."""
    with session_scope() as session:
        return [u.to_json() for u in session.query(User).all()]


def get_user_by_email(user_email, session=None):
    """Get user by email address."""
    with session_scope() as session:
        return session.query(User)\
            .filter(User.email == user_email)\
            .first().to_json()
