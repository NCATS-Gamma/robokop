#!/bin/bash

exec "docker run -it --rm --network=robokop_default postgres psql -h postgres -U $POSTGRES_USER $POSTGRES_DB"