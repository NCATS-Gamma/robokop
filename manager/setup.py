import os
import json
import sys

from flask import Flask, Blueprint
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flasgger import Swagger

app = Flask(__name__, static_folder='../pack', template_folder='../templates')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked
app.config.from_pyfile('robokop_flask_config.py')

mail = Mail(app)
db = SQLAlchemy(app)

api_blueprint = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_blueprint)
app.register_blueprint(api_blueprint)

template = {
    "swagger": "2.0",
    # "openapi": "3.0.1",
    "info": {
        "title": "ROBOKOP Manager",
        "description": "An API for management of biomedical questions and answers",
        "contact": {
            "name": "CoVar Applied Technologies",
            "email": "patrick@covar.com",
            "url": "www.covar.com",
        },
        "termsOfService": {
            "name": "mit"
        },
        "version": "0.0.1"
    },
    "schemes": [
        "http",
        "https"
    ]
}

swagger_config = {
    "headers": [
    ],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}

app.config['SWAGGER'] = {
    'title': 'ROBOKOP Manager API',
    'uiversion': 3
}

swagger = Swagger(app, template=template, config=swagger_config)