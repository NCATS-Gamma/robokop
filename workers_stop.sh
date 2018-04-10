#!/bin/bash

# This should only be run from the main robokop.git directory

cd $ROBOKOP_HOME/robokop/python
celery multi stop answerer@robokop updater@robokop