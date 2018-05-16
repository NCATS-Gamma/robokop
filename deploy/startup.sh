#!/bin/bash
### every exit != 0 fails the script
set -e

cd $ROBOKOP_HOME/robokop
source ./deploy/setenv.sh

# set up postgres tables
python ./deploy/initialize_manager.py

cd - > /dev/null
exec "$@"