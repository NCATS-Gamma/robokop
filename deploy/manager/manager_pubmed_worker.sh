#!/bin/bash

cd $ROBOKOP_HOME/robokop

celery -A manager.tasks.celery worker --loglevel=debug -c 1 -n manager_pubmed@robokop -Q manager_pubmed
