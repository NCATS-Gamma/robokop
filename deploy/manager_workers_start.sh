#!/bin/bash

cd $ROBOKOP_HOME/robokop

echo "Starting worker..."
celery multi start \
    manager_answerer@robokop manager_updater@robokop \
    -A manager.tasks.celery \
    -l info \
    -c:1 $NUM_RANKERS -c:2 $NUM_BUILDERS \
    -Q:1 manager_answer -Q:2 manager_update
#   celery -A tasks.celery worker --loglevel=info -c 4 -n answerer@robokop -Q answer
#   celery -A tasks.celery worker --loglevel=info -c 1 -n updater@robokop -Q update
echo "Worker started."

function cleanup {
    echo "Stopping worker..."
    celery multi stop manager_answerer@robokop manager_updater@robokop
    echo "Worker stopped."
}
trap cleanup EXIT

while :
do
   sleep 10 & # sleep in background
   wait $! # wait for last background process - can be interrupted by trap!
   echo "Sleeping..."
done