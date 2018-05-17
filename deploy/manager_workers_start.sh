#!/bin/bash

cd $ROBOKOP_HOME/robokop

echo "Starting worker..."
celery multi start \
    manager_answerer@robokop manager_updater@robokop manager_initializer@robokop \
    -A manager.tasks.celery \
    -l info \
    -c:1 4 -c:2 1 -c:3 4 \
    -Q:1 manager_answer -Q:2 manager_update -Q:3 manager_initialize
#   celery -A tasks.celery worker --loglevel=info -c 4 -n answerer@robokop -Q answer
#   celery -A tasks.celery worker --loglevel=info -c 1 -n updater@robokop -Q update
echo "Worker started."

function cleanup {
    echo "Stopping worker..."
    celery multi stop manager_answerer@robokop manager_updater@robokop manager_initializer@robokop
    echo "Worker stopped."
}
trap cleanup EXIT

while :
do
   sleep 10 & # sleep in background
   wait $! # wait for last background process - can be interrupted by trap!
   echo "Sleeping..."
done