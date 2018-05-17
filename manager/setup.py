import os
import json
import sys

from flask import Flask, Blueprint
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_restplus import Api

app = Flask(__name__, static_folder='../pack', template_folder='../templates')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked
app.config.from_pyfile('robokop_flask_config.py')

mail = Mail(app)
db = SQLAlchemy(app)

api_blueprint = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_blueprint, version='1.0', title='ROBOKOP Manager API',
    description='An API for management of biomedical questions and answers.') # doc='/swagger/'
app.register_blueprint(api_blueprint)
