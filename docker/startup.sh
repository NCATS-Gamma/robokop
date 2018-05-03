#!/bin/bash
### every exit != 0 fails the script
set -e

cd $ROBOKOP_HOME

export CELERY_BROKER_URL="redis://$REDIS_HOST:$REDIS_PORT/$MANAGER_REDIS_DB"
export CELERY_RESULT_BACKEND="redis://$REDIS_HOST:$REDIS_PORT/$MANAGER_REDIS_DB"
export FLOWER_BROKER_API="redis://$REDIS_HOST:$REDIS_PORT/$MANAGER_REDIS_DB"
export FLOWER_PORT="$MANAGER_FLOWER_PORT"

# set up postgres tables
python ./python/initialize_data.py

exec "$@"