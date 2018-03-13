#!/usr/bin/env bash
set -e

echo "Install APOC"

wget --quiet https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/3.2.3.5/apoc-3.2.3.5-all.jar \
    -O /var/lib/neo4j/plugins/apoc.jar