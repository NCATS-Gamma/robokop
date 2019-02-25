#!/usr/bin/env python

import os
from datetime import datetime
from flask_security import Security, SQLAlchemySessionUserDatastore
from manager.setup import app
from manager.setup_db import init_db, db
from manager.user import User, Role


# with app.app_context():

# Create any database tables that don't exist yet.
init_db()

user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
security = Security(app, user_datastore)  # this sets some app.config

# Create the Roles "admin" and "end-user" -- unless they already exist
user_datastore.find_or_create_role(name='admin', description='Administrator')
user_datastore.find_or_create_role(name='user', description='End user')

admin_email = os.environ['ADMIN_EMAIL']
# create admin user
if not user_datastore.get_user(admin_email):
    user_datastore.create_user(
        email=admin_email,
        username='admin',
        password=os.environ['ADMIN_PASSWORD'],
        active=True,
        confirmed_at=datetime.now(),
    )

# Commit any database changes; the User and Roles must exist before we can add a Role to the User
db.session.commit()

# Give users "user" role, and admin the "admin" role. (This will have no effect if the
# users already have these Roles.)
user_datastore.add_role_to_user(admin_email, 'admin')

# Again, commit any database changes.
db.session.commit()
db.session.close()
