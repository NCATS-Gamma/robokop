from datetime import datetime
from setup import app, db
from user import User, Role
from flask_security import Security, SQLAlchemySessionUserDatastore

# Include these so that all the associated postgres tables get created.
from question import Question
from answer import Answer, AnswerSet

with app.app_context():
    user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
    security = Security(app, user_datastore) # this sets some app.config

    # Create any database tables that don't exist yet.
    db.create_all()

    # Create the Roles "admin" and "end-user" -- unless they already exist
    user_datastore.find_or_create_role(name='admin', description='Administrator')
    user_datastore.find_or_create_role(name='user', description='End user')

    # Create users for testing purposes -- unless they already exists.
    users = ['homer', 'marge', 'bart', 'lisa', 'maggie']
    for u in users:
        u_email = u + '@simpsons.com'
        if not user_datastore.get_user(u_email):
            user_datastore.create_user(
                email=u_email,
                username=u_email,
                password='abcd',
                active=True,
                confirmed_at=datetime.now(),
            )

    if not user_datastore.get_user('admin@admin.com'):
        user_datastore.create_user(
            email='admin@admin.com',
            username='admin@admin.com',
            password='1234',
            active=True,
            confirmed_at=datetime.now(),
        )

    # Commit any database changes; the User and Roles must exist before we can add a Role to the User
    db.session.commit()

    # Give users "user" role, and admin the "admin" role. (This will have no effect if the
    # users already have these Roles.)
    for u in users:
        u_email = u + '@simpsons.com'
        user_datastore.add_role_to_user(u_email, 'user')

    user_datastore.add_role_to_user('admin@admin.com', 'admin')

    # Again, commit any database changes.
    db.session.commit()