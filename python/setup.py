import logging.config
import os
import json

from flask import Flask
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_folder='../pack', template_folder='../templates')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked
app.config.from_pyfile('robokop_flask_config.py')

mail = Mail(app)
db = SQLAlchemy(app)
