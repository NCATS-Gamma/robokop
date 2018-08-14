#!/bin/bash

cd $ROBOKOP_HOME/robokop

celery -A manager.tasks.celery worker --loglevel=debug -c $NUM_BUILDERS -n manager_updater@robokop -Q manager_update
