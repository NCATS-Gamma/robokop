#!/bin/bash
### every exit != 0 fails the script
set -e

chown -R murphy:murphy $ROBOKOP_HOME

cd $ROBOKOP_HOME/robokop
source ./deploy/setenv.sh

# npm install
# npm run webpackDev

find . -name "*.pid" -exec rm -rf {} \;

cd - > /dev/null
exec "$@"