import logging.config
import os
import json
import sys

from flask import Flask
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy

builder_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build', 'builder')
sys.path.insert(0, builder_path)
greent_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces')
sys.path.insert(0, greent_path)
from builder import setup

app = Flask(__name__, static_folder='../pack', template_folder='../templates')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked
app.config.from_pyfile('robokop_flask_config.py')

mail = Mail(app)
db = SQLAlchemy(app)

rosetta = setup(os.path.join(greent_path, 'greent', 'greent.conf'))
