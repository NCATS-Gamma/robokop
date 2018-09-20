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

class WF1MOD3(Resource):
    def get(self, disease_curie):
        """
        Apply WF1.MOD3 to the provided disease.
        ---
        tags: [workflow]
        parameters:
          - in: path
            name: disease_curie
            description: Disease curie to which module 3 should be applied
            schema:
                type: string
            required: true
          - in: query
            name: max_results
            description: Maximum number of results to return. Provide -1 to indicate no maximum.
            schema:
                type: integer
            default: 250
        responses:
            200:
                description: Answer set
                content:
                    application/json:
                        schema:
                            $ref: '#/definitions/Response'
        """
        max_results = request.args.get('max_results', default=250)
        qspec = {
            "machine_question": {
                "edges": [
                    {
                        "source_id": 0,
                        "target_id": 1,
                        "type": "contributes_to"
                    },
                    {
                        "source_id": 2,
                        "target_id": 1,
                        "type": "positively_regulates__entity_to_entity"
                    },
                    {
                        "source_id": 3,
                        "target_id": 2,
                        "type": "decreases_activity_of"
                    }
                ],
                "nodes": [
                    {
                        "curie": disease_curie,
                        "id": 0,
                        "type": "disease"
                    },
                    {
                        "id": 1,
                        "type": "chemical_substance"
                    },
                    {
                        "id": 2,
                        "type": "gene"
                    },
                    {
                        "id": 3,
                        "type": "chemical_substance"
                    }
                ]
            }
        }

        logger.debug(qspec)
        response = requests.post(
            f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/?max_results={max_results}",
            json=qspec)
        polling_url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{response.json()['task_id']}"

        for _ in range(60 * 60):  # wait up to 1 hour
            logger.debug(f'polling {polling_url}...')
            time.sleep(1)
            response = requests.get(polling_url)
            if response.status_code == 200:
                if response.json()['status'] == 'FAILURE':
                    return 'ROBOKOP failed. See the logs.', 500
                if response.json()['status'] == 'REVOKED':
                    return 'ROBOKOP task terminated by admin.', 500
                if response.json()['status'] == 'SUCCESS':
                    break
        else:
            return "ROBOKOP has not completed after 1 hour. It's still working.", 202

        response = requests.get(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/result/{response.json()['task_id']}?standardize=true")

        answerset = response.json()
        # strip out support edges for now
        for result in answerset['result_list']:
            result['result_graph']['edge_list'] = [edge for edge in result['result_graph']['edge_list'] if edge['type'] != 'literature_co-occurrence']

        return answerset, 200

api.add_resource(WF1MOD3, '/wf1mod3/<disease_curie>/')

class Tasks(Resource):
    def get(self):
        """
        Get list of tasks (queued and completed)
        ---
        tags: [tasks]
        responses:
            200:
                description: tasks
                content:
                    application/json:
                        schema:
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
            schema:
                type: string
            required: true
        responses:
            200:
                description: task
                content:
                    application/json:
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
            schema:
                type: string
            required: true
        responses:
            204:
                description: task revoked
                content:
                    text/plain:
                        schema:
                            type: string
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
        requestBody:
            name: "question"
            description: "Natural-language question"
            required: true
            content:
                text/plain:
                    schema:
                        type: string
                        example: "What genes affect Ebola?"
        responses:
            200:
                description: "Here's your graph"
                content:
                    application/json:
                        schema:
                            $ref: "#/definitions/Graph"
            400:
                description: "Something went wrong"
                content:
                    text/plain:
                        schema:
                            type: string
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
                content:
                    application/json:
                        schema:
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
                content:
                    application/json:
                        schema:
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
                content:
                    application/json:
                        schema:
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
            schema:
                type: string
            required: true
            example: ebola
          - in: path
            name: category
            description: "biomedical concept category"
            schema:
                type: string
            required: true
            example: disease
        responses:
            200:
                description: "biomedical identifiers"
                content:
                    application/json:
                        schema:
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
                content:
                    application/json:
                        schema:
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
                                    example: me@mydomain.edu
        """
        user = getAuthData()
        return user

api.add_resource(User, '/user/')
