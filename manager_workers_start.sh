#!/bin/bash

# This should only be run from the main robokop.git directory

cd $ROBOKOP_HOME/robokop/python
export CELERY_BROKER_URL=$MANAGER_CELERY_BROKER_URL
export CELERY_RESULT_BACKEND=$MANAGER_CELERY_RESULT_BACKEND
celery multi start \
    manager_answerer@robokop manager_updater@robokop manager_initializer@robokop \
    -A tasks.celery \
    -l info \
    -c:1 4 -c:2 1 -c:3 4 \
    -Q:1 manager_answer -Q:2 manager_update -Q:3 manager_initialize
export FLOWER_PORT=$MANAGER_FLOWER_PORT
celery flower -A tasks.celery --broker=$MANAGER_FLOWER_BROKER_API --broker_api=$MANAGER_FLOWER_BROKER_API
# waits here for SIGINT
celery multi stop manager_answerer@robokop manager_updater@robokop manager_initializer@robokop

# `celery multi start...`` is equivalent to:
#   celery -A tasks.celery worker --loglevel=info -c 4 -n answerer@robokop -Q answer
#   celery -A tasks.celery worker --loglevel=info -c 1 -n updater@robokop -Q update