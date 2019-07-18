"""Set up Flask and flasgger."""

import os
import traceback
import logging

from flask import Flask, Blueprint
from flask_mail import Mail
from flask_restful import Api
from flask_cors import CORS
from flasgger import Swagger
import werkzeug

from manager import logging_config

logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../pack', template_folder='../templates')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked
app.config.from_pyfile('robokop_flask_config.py')

mail = Mail(app)

api_blueprint = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_blueprint)
app.register_blueprint(api_blueprint)

template = {
    "openapi": "3.0.1",
    "info": {
        "title": "ROBOKOP Manager",
        "description": "An API for management of biomedical questions and answers",
        "contact": {
            "name": "NCATS Gamma",
            "email": "patrick@covar.com",
            "url": "https://github.com/NCATS-Gamma",
        },
        "termsOfService": {
            "name": "mit"
        },
        "version": "0.0.1"
    },
    "schemes": [
        "http",
        "https"
    ],
    "tags": [
        {"name": "answerset"},
        {"name": "question"},
        {"name": "tasks"},
        {"name": "simple"},
        {"name": "util"}
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
    "specs_route": "/apidocs/",
    "openapi": "3.0.1",
    'swagger_ui_bundle_js': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui-bundle.js',
    'swagger_ui_standalone_preset_js': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui-standalone-preset.js',
    'swagger_ui_css': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui.css',
    'swagger_ui_js': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui.js'
}

app.config['SWAGGER'] = {
    'title': 'ROBOKOP Manager API',
    'uiversion': 3
}

swagger = Swagger(app, template=template, config=swagger_config)


@app.errorhandler(Exception)
def handle_error(ex):
    """Handle all server errors."""
    if isinstance(ex, werkzeug.exceptions.HTTPException):
        raise ex
    tb = traceback.format_exception(etype=type(ex), value=ex, tb=ex.__traceback__)
    logger.exception(ex)
    # return tb[-1], 500
    return "Internal server error. See the logs for details.", 500
app.register_error_handler(500, handle_error)
app.config['PROPAGATE_EXCEPTIONS'] = True
app.url_map.strict_slashes = False
CORS(app, resources=r'/api/*')
