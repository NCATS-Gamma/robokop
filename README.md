# ROBOKOP

ROBOKOP is a tool for reasoning over structured biomedical knowledge databases as part of the NCATS translator and reasoner programs. The ROBOKOP system consists of a web based user interface, an API server, and several worker servers. The code is separated into three separate repositories.

* robokop - https://github.com/ncats-Gamma/robokop - UI and entry point
* robokop-interfaces - https://github.com/ncats-Gamma/robokop-interfaces - Knowledge source interfaces and knowledge graph building
* robokop-rank - https://github.com/ncats-Gamma/robokop-rank - Find and ranks subgraphs based on a supplied question

This repository is the main repository for the user interface and storage modules. It is also used for issue tracking associated with the entire stack.

## Example Installation
See an instance at http://robokop.renci.org

## Setup Instructions 

### Structure of source code

We create a root robokop directory and clone the three repos into it: robokop, robokop-interfaces, and robokop-rank. 

In the root directory, we create shared and logs diretories. 

Into the "shared" directory we need a "robokop.env" file with setup environment variables. This is discussed in more detail below.

This is our directory structure:
```
robokop-root
├── logs
├── robokop
├── robokop-interfaces
├── robokop-rank
└── shared
    └── robokop.env
```

A few more folders will be created in this directory depending on which docker containers are in use.

### Prerequisites

Robokop requires docker, docker-compose and Node.js. These must be installed and configured correctly. For additional install notes for CentOS 7. See [here](./doc/centos_installation.md). For installation on Windows, please refer to the section on [Windows installation](#windows)

### Docker-Compose Files

Robokop uses a collection of docker containers managed through several instances of docker-compose. Independent docker-compose files are used to enable different parts of the system to be deployed on separate machines. 

* robokop/deploy/backend - Rabbit MQ message broker, Celery results redis backend, NLP machine
* robokop/deploy/manager - Web UI, API server, UI storage, Graphql server
* robokop/deploy/graph - Neo4j graph database
* robokop/deploy/cache - Redis cache of http requests
* robokop-rank/deploy/ranker - API server for ranking service
* robokop-rank/deploy/omnicorp - Postgres storage for omnicorp pairs
* robokop-interfaces/deploy - API server for knowledge graph construction service

Each of these docker-compose files will control one or more docker containers. Some of these containers such as the Neo4j database (robokop/deploy/graph) and the Omnicorp (robokop-rank/deploy/omnicorp) can be rather resource intensive. It may be advantageous to place those containers on different machines.  Communications between all of these containers can then be done using a common Docker network or WAN. These settings are configurable through environmental variables.

### Environment settings

`robokop-root/shared/robokop.env` needs to hold a variety of configuration parameters. These parameters specify public ports and the location of other components of the system. 

```
#################### ROBOKOP Environmental Variables ####################

# Web Interface and API
ROBOKOP_HOST=127.0.0.1
ROBOKOP_PROTOCOL=http
MANAGER_PORT=80

# Number of celery works to answer tasks and rebuild graphs
MANAGER_NUM_ANSWER_WORKERS=4
MANAGER_NUM_BUILDER_WORKERS=4

# Flask Security settings for user creation, mail etc.
#ROBOKOP_SECRET_KEY
#ROBOKOP_SECURITY_PASSWORD_SALT
#ROBOKOP_MAIL_SERVER
#ROBOKOP_MAIL_USERNAME
#ROBOKOP_MAIL_PASSWORD
#ROBOKOP_DEFAULT_MAIL_SENDER
#ROBOKOP_SECURITY_EMAIL_SENDER

# Web Interface Storage - Users, Questions and Answers - Postgres
POSTGRES_HOST=postgres
# Location here is referenced by container name on the local docker network
POSTGRES_PORT=5432
POSTGRES_USER=murphy
POSTGRES_DB=robokop
#POSTGRES_PASSWORD
#ADMIN_EMAIL
#ADMIN_PASSWORD

GRAPHQL_HOST=graphql
GRAPHQL_PORT=6423

# NPL Server - Future
NLP_HOST=nlp
NLP_PORT=9475

# Graph DB - NEO4j
NEO4J_HOST=robokopdb.renci.org
# This references an external instance
# The machine hosting this env file will not start the graph container
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
NEO4J_HEAP_MEMORY=32G
# Only used by the machine that runs this container
NEO4J_HEAP_MEMORY_INIT=32G
# Only used by the machine that runs this container
NEO4J_CACHE_MEMORY=32G
# Only used by the machine that runs this container
#NEO4J_PASSWORD

# HTTP Cache - Redis
CACHE_HOST=robokopdb.renci.org
# Externally hosted request cache
CACHE_PORT=6380
CACHE_DB=0
#CACHE_PASSWORD

# Builder API - robokop-interfaces - Flask server with celery workers
BUILDER_HOST=interfaces
BUILDER_PORT=6010
BUILDER_NUM_WORKERS=4

# Builder Internal Communication Cache - Redis
BUILD_CACHE_HOST=build_cache
BUILD_CACHE_PORT=6379
BUILD_CACHE_DB=1
# Port is not publish outside of containers, no password is applied

# Celery Queue Results Backend - Redis
RESULTS_HOST=celery_results
RESULTS_PORT=6381
#RESULTS_PASSWORD
MANAGER_RESULTS_DB=0
BUILDER_RESULTS_DB=1
RANKER_RESULTS_DB=2

# Celery Message Broker - RabbitMQ
BROKER_HOST=broker
BROKER_PORT=5672
BROKER_MONITOR_PORT=15672
BROKER_USER=murphy
#BROKER_PASSWORD

# Ranking API - robokop-rank - Flask server, Open API and with celery workers
RANKER_HOST=rank
RANKER_PORT=6011
RANKER_NUM_WORKERS=4

# Literary Co-occurence Server for ranking
OMNICORP_HOST=robokopdb.renci.org
#omnicorp
OMNICORP_PORT=5433
OMNICORP_DB=robokop
OMNICORP_USER=murphy
#OMNICORP_PASSWORD

# Supervisor
# Manager, Builder and Ranker all user supervisor to manager celery daemon
MANAGER_SUPERVISOR_PORT=9001
BUILDER_SUPERVISOR_PORT=9002
RANKER_SUPERVISOR_PORT=9003
SUPERVISOR_USER=admin
# SUPERVISOR_PASSWORD

COMPOSE_PROJECT_NAME=robokop

#############################################################
####################### Secret stuff ########################
ADMIN_EMAIL=<your-email@x.org>
ADMIN_PASSWORD=----------------------------------
POSTGRES_PASSWORD=----------------------------------
NEO4J_PASSWORD=----------------------------------
CACHE_PASSWORD=----------------------------------
RESULTS_PASSWORD=----------------------------------
BROKER_PASSWORD=----------------------------------
SUPERVISOR_PASSWORD=----------------------------------
OMNICORP_PASSWORD=----------------------------------
ROBOKOP_SECRET_KEY=----------------------------------
ROBOKOP_SECURITY_PASSWORD_SALT=----------------------------------
ROBOKOP_MAIL_SERVER=----------------------------------
ROBOKOP_MAIL_USERNAME=----------------------------------
ROBOKOP_MAIL_PASSWORD=----------------------------------
ROBOKOP_DEFAULT_MAIL_SENDER=----------------------------------
ROBOKOP_SECURITY_EMAIL_SENDER=----------------------------------
#############################################################
```
You'll need to supply values for the secret things at the end.

### Building Containers

For each container listed above you will need to build the container with specified user and group permissions so that log file ownership does not get elevated. For example for the primary robokop UI container

```
$ cd robokop/
$ docker build --build-arg UID=$(id -u) --build-arg GID=$(id -g) -t robokop_manager -f deploy/manager/Dockerfile .
```

This process should be repeated for `robokop-interfaces/deploy` and `robokop-rank/deploy/ranker`. Other containers can be built using `docker-compose build`.

### Web Interface Compilation

The web front end is built in React and transpiled using webpack. Node.js must be installed. Following that the necessary dependencies must be downloaded.

```
$ cd robokop/
$ npm install
```

And the source must be transpiled

```
$ cd robokop/
$ npm run webpackProd
```

## Starting Containers

Once all containers are built each can be started using 

```
docker-compose up
```

This process must be completed such that each docker-compose is started. It is not required that each container is running on the same machine, but the environmental variables must be modified to note the location where different services are running. For example, for the environmental variables shown above, two machines are in use. `robokopdb.renci.org` is used to host the Neo4j database, the Omnicorp database, and the redis HTTP request cache. This is reflected in the environmental variables `NEO4J_HOST`, `OMNICORP_HOST` and, `CACHE_HOST`. All other containers are running on `robokop.renci.org`. These containers are all on the same docker network and can then be routed using their container names. With this configuration this same set of environmental variables can be used on both machines. It is possible that other configurations may require different environmental variables on each machine, for example if the `ranker` and `manager` where running on different machines.  


## Web Interfaces

With all containers started you can now monitor each component using the urls below (using the port settings listed above).

* http://127.0.0.1 - The robokop user interface
* http://127.0.0.1/apidocs/ - The robokop user interface API
* http://127.0.0.1:6010/apidocs/ - The robokop-interfaces API
* http://127.0.0.1:6011/apidocs/ - The robokop-rank API
* http://127.0.0.1:6423/graphql/ - The robokop user interface graphql server
* http://127.0.0.1:6423/graphiql/ - The robokop user interface graphiql web interface
* http://127.0.0.1:7474 - NEO4j http interface
* bolt://127.0.0.1:7687 - NEO4j bolt interface
* http://127.0.0.1:15672 - Rabbit MQ interface for queue management
* http://127.0.0.1:9001 - Manager supervisord interface
* http://127.0.0.1:9002 - Builder supervisord interface
* http://127.0.0.1:9003 - Ranker supervisord interface

## <a name="windows"></a>Windows Installation
To install on Windows, we recommend utilizing the Windows subsystem for Linux (WSL). 
1. First, you will need to install Docker for Windows. Then follow the instructions [here](https://nickjanetakis.com/blog/setting-up-docker-for-windows-and-wsl-to-work-flawlessly) to get docker working on WSL.

2. Install Node.js in WSL

3. Docker does not correctly follow the symlinks in the `.env` file in each of the "Docker-Compose Files" section when executed on Windows / WSL. To get `docker-compose build` and `docker-compose up` to work correctly, you will need to do the following in any given bash session prior to executing any docker commands. These will ensure that the env variables defined in `/shared/robokop.env` are correctly exported when executing the docker commands
    1. `set -a`
    2. `source ../../../shared/robokop.env`

4. You can add the 2 commands above to your `.bashrc` file in WSL to ensure that these env variables are always available and correctly exported and made available to docker. Note that the relative path to the `/shared/robokop.env` file will differ based on your current working directory in your bash session.

5. Run the steps outlined in the "Web Interface Compilation" section

## Contributing

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
