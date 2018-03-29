#!/bin/bash

export NEO4J_HOST=172.18.0.21
export NEO4J_HTTP_PORT=7474
export NEO4J_BOLT_PORT=7687

export REDIS_HOST=172.18.0.22
export REDIS_PORT=6379

export CELERY_BROKER_URL="redis://$REDIS_HOST:$REDIS_PORT/0"
export CELERY_RESULT_BACKEND="redis://$REDIS_HOST:$REDIS_PORT/0"

export POSTGRES_HOST=172.18.0.23
export POSTGRES_PORT=5432
export POSTGRES_USER=murphy
export POSTGRES_DB=robokop

export ROBOKOP_HOST=172.18.0.24

# network
docker network create \
    --subnet=172.18.0.0/16 \
    robokop-docker-net

# Neo4J plugins
mkdir ./neo4j_plugins
curl https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/3.3.0.2/apoc-3.3.0.2-all.jar -o neo4j_plugins/apoc.jar
curl https://github.com/NCATS-Gamma/robokop-neo4j-plugin/releases/download/v1.0.0/robokop-1.0.0.jar -o neo4j_plugins/robokop.jar

# Neo4j:
# https://hub.docker.com/_/neo4j/
# https://neo4j.com/docs/operations-manual/current/installation/docker/
# https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/
docker run \
    --name robokop-neo4j \
    --net robokop-docker-net \
    --ip $NEO4J_HOST \
    --env NEO4J_dbms_security_auth__enabled=false \
    --env NEO4J_dbms_connectors_default__listen__address=0.0.0.0 \
    --publish $NEO4J_HTTP_PORT:$NEO4J_HTTP_PORT \
    --publish $NEO4J_BOLT_PORT:$NEO4J_BOLT_PORT \
    -d \
    patrickkwang/robokop-neo4j

# Redis:
# https://hub.docker.com/_/redis/
docker run \
    --name robokop-redis \
    --net robokop-docker-net \
    --ip $REDIS_HOST \
    --publish $REDIS_PORT:$REDIS_PORT \
    -d \
    redis

# Postgres:
# https://hub.docker.com/_/postgres/
docker run \
    --name robokop-postgres \
    --net robokop-docker-net \
    --ip $POSTGRES_HOST \
    --env POSTGRES_USER \
    --env POSTGRES_DB \
    --publish $POSTGRES_PORT:$POSTGRES_PORT \
    -d \
    postgres
# docker run -it --rm --net robokop-docker-net postgres psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

# Web server
# In development mode we will assume that we start the server manually (outside of Docker)
# 
# docker run \
#     --name robokop-web \
#     --net robokop-docker-net \
#     --ip $ROBOKOP_HOST \
#     --env NEO4J_HOST \
#     --env NEO4J_HTTP_PORT \
#     --env NEO4J_BOLT_PORT \
#     --env REDIS_HOST \
#     --env REDIS_PORT \
#     --env CELERY_BROKER_URL \
#     --env CELERY_RESULT_BACKEND \
#     --env POSTGRES_HOST \
#     --env POSTGRES_PORT \
#     --env POSTGRES_USER \
#     --env POSTGRES_DB \
#     --publish 80:80 \
#     -v $(pwd)/shared:/home/murphy/shared \
#     -it \
#     robokop bash

# to detach:   CTRL-q, CTRL-p
# to reattach: docker attach robokop-web

# docker stop robokop-web robokop-neo4j robokop-redis robokop-postgres
# docker rm robokop-web robokop-neo4j robokop-redis robokop-postgres