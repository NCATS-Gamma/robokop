#!/bin/bash
### every exit != 0 fails the script
set -e

# set secret environment variables
source ../shared/setenv

# edit greent config - janky! (order matters)
sed -i -e "s/localhost:7687/$NEO4J_HOST:$NEO4J_BOLT_PORT/" ../robokop-interfaces/greent/greent.conf
sed -i -e "s/6379/$REDIS_PORT/" ../robokop-interfaces/greent/greent.conf
sed -i -e "s/localhost/$REDIS_HOST/" ../robokop-interfaces/greent/greent.conf

# edit builder config
sed -i -e "s/localhost:7687/$NEO4J_HOST:$NEO4J_BOLT_PORT/" ../robokop-build/builder/builder.py

# set up Neo4j type graph
cd /home/murphy/robokop-interfaces/greent
PYTHONPATH=.. python rosetta.py --initialize-type-graph
cd /home/murphy/robokop

# set up postgres tables
python python/initialize_data.py

# run celery workers
PYTHONPATH=/home/murphy/robokop/python celery multi start answerer@robokop updater@robokop -A tasks.celery -l info -c:1 4 -c:2 1 -Q:1 answer -Q:2 update

# run server
nohup gunicorn -c serverConfig.py python.wsgi:app &

exec "$@"