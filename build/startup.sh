#!/bin/bash
### every exit != 0 fails the script
set -e

source ../shared/setenv
sed -i -e "s/localhost:7474/$NEO4J_HOST:$NEO4J_HTTP_PORT/" ../robokop-interfaces/greent/greent.conf
sed -i -e "s/localhost:7687/$NEO4J_HOST:$NEO4J_BOLT_PORT/" ../robokop-build/builder/builder.py

cd /home/murphy/robokop-interfaces/greent
PYTHONPATH=.. python rosetta.py --initialize-type-graph
cd /home/murphy/robokop

PYTHONPATH=/home/murphy/robokop/python celery multi start answerer@robokop updater@robokop -A tasks.celery -l info -c:1 4 -c:2 1 -Q:1 answer -Q:2 update

nohup gunicorn -c serverConfig.py python.wsgi:app &

exec "$@"