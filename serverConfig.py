"""
Config file for gunicorn
"""

import os
import json

# Our local config is in the main directory along with this config.
# We will use this host and port if we are running from python and not gunicorn
local_config = {'serverHost': '0.0.0.0', 'port': 5000} # Defaults

config_dir = os.path.dirname(os.path.realpath(__file__))
json_file = os.path.join(config_dir,'config.json')
with open(json_file, 'rt') as json_in:
    local_config = json.load(json_in)

bind = '{}:{}'.format(local_config['serverHost'], local_config['port'])
workers = 4
worker_class = 'eventlet'