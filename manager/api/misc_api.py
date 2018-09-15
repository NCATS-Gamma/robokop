#!/usr/bin/env python

"""ROBOKOP manager layer"""

import os
import sys
import json
import time

import redis
import requests
from flask import request, Response
from flask_restful import Resource, abort

from manager.setup import app, api, db
from manager.logging_config import logger
from manager.util import getAuthData
from manager.tasks import celery
from manager.task import list_tasks, get_task_by_id

concept_map = {}
try:
    with app.open_resource('api/concept_map.json') as map_file:
        concept_map = json.load(map_file)
        logger.warning('Succesfully read concept_map.json')
except Exception as e:
    logger.error(
        'misc_api.py:: Could not '
        f'find/read concept_map.json - {e}')

class Tasks(Resource):
    def get(self):
        """
        Get list of tasks (queued and completed)
        ---
        tags: [tasks]
        responses:
            200:
                description: tasks
                type: array
                items:
                    $ref: '#/definitions/Task'
        """
        tasks = list_tasks(session=db.session)
        return [t.to_json() for t in tasks]

api.add_resource(Tasks, '/tasks/')

class TaskStatus(Resource):
    def get(self, task_id):
        """Get status for task
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: task_id
            description: "task id"
            type: string
            required: true
        responses:
            200:
                description: task
                schema:
                    $ref: '#/definitions/Task'
        """
        
        return get_task_by_id(task_id).to_json()

    def delete(self, task_id):
        """Revoke task
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: task_id
            description: "task id"
            type: string
            required: true
        responses:
            204:
                description: task revoked
        """
        
        celery.control.revoke(task_id, terminate=True)

        return '', 204

api.add_resource(TaskStatus, '/t/<task_id>/')

class NLP(Resource):
    def post(self):
        """
        Parse Question
        ---
        tags: [util]
        summary: "Convert a natural-language question into machine-readable form."
        consumes:
          - text/plain
        parameters:
          - in: "body"
            name: "question"
            description: "Natural-language question"
            required: true
            schema:
                type: string
                example: "What genes affect Ebola?"
        responses:
            200:
                description: "Here's your graph"
                schema:
                    $ref: "#/definitions/Graph"
            400:
                description: "Something went wrong"
        """
        response = requests.post(f"http://{os.environ['NLP_HOST']}:{os.environ['NLP_PORT']}/api/parse/", data=request.get_data())
        return Response(response.content, response.status_code)

api.add_resource(NLP, '/nlp/')

class Concepts(Resource):
    def get(self):
        """
        Get known biomedical concepts
        ---
        tags: [util]
        responses:
            200:
                description: concepts
                type: array
                items:
                    type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/concepts")
        concepts = r.json()
        bad_concepts =['NAME.DISEASE', 'NAME.PHENOTYPE', 'NAME.DRUG']
        concepts = [c for c in concepts if not c in bad_concepts]
        concepts.sort()
        return concepts

api.add_resource(Concepts, '/concepts/')

class Connections(Resource):
    def get(self):
        """
        Get possible connections between biomedical concepts
        ---
        tags: [util]
        responses:
            200:
                description: concepts
                type: array
                items:
                    type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/connections")
        connections = r.json()

        return connections

api.add_resource(Connections, '/connections/')
    
class Operations(Resource):
    def get(self):
        """
        Get a machine readable list of all connections between biomedical concepts with sources
        ---
        tags: [util]
        responses:
            200:
                description: concepts
                type: array
                items:
                    type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/operations")
        operations = r.json()

        return operations

api.add_resource(Operations, '/operations/')

class Search(Resource):
    def get(self, term, category):
        """
        Look up biomedical search term using bionames service
        ---
        tags: [util]
        parameters:
          - in: path
            name: term
            description: "biomedical term"
            type: string
            required: true
            example: ebola
          - in: path
            name: category
            description: "biomedical concept category"
            type: string
            required: true
            example: disease
        responses:
            200:
                description: "biomedical identifiers"
                type: array
                items:
                    type: string
        """
        if category not in concept_map:
            abort(400, error_message=f'Unsupported category: {category} provided')
        bionames = concept_map[category]
        
        if not bionames: # No matching biolink name for this category
            return []
        
        results = []
        error_status = {'isError': False}
        for bioname in bionames:
            url = f"https://bionames.renci.org/lookup/{term}/{bioname}/"
            r = requests.get(url)
            if r.ok:
                all_results = r.json()
                for r in all_results:
                    if not 'id' in r:
                        continue
                    if 'label' in r:
                        r['label'] = r['label'] or r['id']
                    elif 'desc' in r:
                        r['label'] = r['desc'] or r['id']
                        r.pop('desc')
                    else:
                        continue
                    results.append(r)
            else:
                error_status['isError'] = True
                error_status['code'] = r.status_code

        results = list({r['id']:r for r in results}.values())
        if not results and error_status['isError'] :
            abort(error_status['code'], f"Bionames lookup endpoint returned {error_status['code']} error code")
        else:
            return results

api.add_resource(Search, '/search/<term>/<category>/')

class User(Resource):
    def get(self):
        # perhaps don't document this because it's only used by the web GUI
        """
        Get current user info
        ---
        tags: [util]
        responses:
            200:
                description: user
                type: object
                properties:
                    is_authenticated:
                        type: string
                        example: true
                    is_active:
                        type: string
                        example: true
                    is_anonymous:
                        type: string
                        example: false
                    is_admin:
                        type: string
                        example: false
                    username:
                        type: string
                        example: patrick@covar.com
        """
        user = getAuthData()
        return user

api.add_resource(User, '/user/')
