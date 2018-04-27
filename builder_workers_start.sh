#!/bin/bash

cd $ROBOKOP_HOME/robokop/builder
celery multi start \
    updater@robokop \
    -A builder_tasks.celery \
    -l info \
    -c:1 1\
    -Q:1 update
celery flower -A builder_tasks.celery
export FLOWER_PORT=5556
# waits here for SIGINT
celery multi stop updater@robokop
