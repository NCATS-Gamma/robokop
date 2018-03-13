#!/usr/bin/env bash
set -e

echo "Install Neo4j"

# get ready to install openjdk-8 (debian 8 or ubuntu 14.04)
# echo "deb http://http.debian.net/debian jessie-backports main" > /etc/apt/sources.list.d/jessie-backports.list
# apt-get update
# apt-get -t jessie-backports install -yq ca-certificates-java

# get ready to install neo4j
wget -O - https://debian.neo4j.org/neotechnology.gpg.key | apt-key add -
echo 'deb http://debian.neo4j.org/repo stable/' | tee -a /etc/apt/sources.list.d/neo4j.list
apt-get update

# install neo4j (and openjdk-8)
apt-get install -yq neo4j=3.2.6