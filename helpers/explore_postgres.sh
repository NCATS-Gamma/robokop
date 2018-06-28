#!/bin/bash

CMD="docker run -it --rm --network=robokop_default -e "PGPASSWORD=$POSTGRES_PASSWORD" postgres psql -h postgres -U $POSTGRES_USER $POSTGRES_DB"
exec $CMD