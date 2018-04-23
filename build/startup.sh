#!/bin/bash
### every exit != 0 fails the script
set -e

# set secret environment variables
source ../shared/setenv.sh

# # edit greent config - janky! (order matters)
# sed -i -e "s/localhost:7687/$NEO4J_HOST:$NEO4J_BOLT_PORT/" ../robokop-interfaces/greent/greent.conf
# sed -i -e "s/6379/$REDIS_PORT/" ../robokop-interfaces/greent/greent.conf
# sed -i -e "s/localhost/$REDIS_HOST/" ../robokop-interfaces/greent/greent.conf

# # edit builder config
# sed -i -e "s/localhost:7687/$NEO4J_HOST:$NEO4J_BOLT_PORT/" ../robokop-build/builder/builder.py

cd $ROBOKOP_HOME

# set up Neo4j type graph
./initialize_type_graph.sh

# set up postgres tables
python ./python/initialize_data.py

# run celery workers
./workers_start.sh

# run server
nohup gunicorn -c serverConfig.py python.wsgi:app &

exec "$@"