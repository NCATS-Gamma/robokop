#!/bin/bash

cd $ROBOKOP_HOME/robokop

celery -A manager.tasks.celery worker --loglevel=debug -c $MANAGER_NUM_BUILDER_WORKERS -n manager_updater@robokop -Q manager_update
