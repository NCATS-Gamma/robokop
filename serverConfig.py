"""
Config file for gunicorn
"""

import os
import json

# Get host and port from environmental variables
server_host = os.environ['ROBOKOP_HOST']
server_port = os.environ['MANAGER_PORT']

bind = '{}:{}'.format(server_host, server_port)
workers = 4
worker_class = 'eventlet'
timeout= 60*60*4