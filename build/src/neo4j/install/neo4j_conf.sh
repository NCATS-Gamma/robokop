#!/usr/bin/env bash
set -e

echo "Configure Neo4j"

sed -i -e 's/#dbms.security.auth_enabled=false/dbms.security.auth_enabled=false/g' /etc/neo4j/neo4j.conf
sed -i -e 's/#dbms.connectors.default_listen_address=0.0.0.0/dbms.connectors.default_listen_address=0.0.0.0/g' /etc/neo4j/neo4j.conf