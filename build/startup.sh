#!/bin/bash
### every exit != 0 fails the script
set -e

service neo4j start

nohup gunicorn -c serverConfig.py python.wsgi:app &

exec "$@"