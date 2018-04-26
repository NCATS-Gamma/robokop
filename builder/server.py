#!/usr/bin/env python

"""Flask REST API server for builder"""

import os
from flask_restplus import Resource
from flask import request
from setup import app, api
from builder_tasks import update_kg

@api.route('/')
@api.doc(params={'question': 'A question specification'})
class UpdateKG(Resource):
    @api.response(202, 'Knowledge graph refresh in progress')
    def post(self):
        """Refresh knowledge graph for question"""
        task = update_kg.apply_async(args=[request.json])
        polling_url = f'http://{os.environ["FLOWER_ADDRESS"]}:{os.environ["FLOWER_PORT"]}/api/task/result/{task.id}'
        return {'poll': polling_url}, 202

if __name__ == '__main__':

    # Get host and port from environmental variables
    server_host = os.environ['ROBOKOP_HOST']
    server_port = 6011

    app.run(host=server_host,\
        port=server_port,\
        debug=False,\
        use_reloader=False)
