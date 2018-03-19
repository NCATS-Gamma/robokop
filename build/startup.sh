#!/bin/bash
### every exit != 0 fails the script
set -e

source ../sensitives/setenv

PYTHONPATH=/home/murphy/robokop/python celery multi start answerer@robokop updater@robokop -A tasks.celery -l info -c:1 4 -c:2 1 -Q:1 answer -Q:2 update

nohup gunicorn -c serverConfig.py python.wsgi:app &

exec "$@"