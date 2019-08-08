#!/bin/bash

$ROBOKOP_HOME/robokop/node_modules/.bin/postgraphile \
    --append-plugins postgraphile-plugin-connection-filter \
    --host 0.0.0.0 \
    --port $GRAPHQL_PORT \
    --simple-collections only \
    -c postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --disable-default-mutations \
    --watch \
    --cors