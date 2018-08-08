# ROBOKOP

ROBOKOP is a tool for reasoning over structured biomedical knowledge databases as part of the NCATS translator and reasoner programs. The ROBOKOP system consists of a web based user interface, an API server, and several worker servers. The code is separated into three separate repositories.

* robokop - https://github.com/ncats-Gamma/robokop - UI and entry point
* robokop-interfaces - https://github.com/ncats-Gamma/robokop-interfaces - Knowledge source interfaces and knowledge graph building
* robokop-rank - https://github.com/ncats-Gamma/robokop-rank - Find and ranks subgraphs based on a supplied question

This repository is the main repository for the user interface and common storage modules. It is also used f or issues associated with the entire stack.

## Example Installation
See an instance at http://robokop.renci.org

* http://robokop.renci.org - The Robokop user interface
* http://robokop.renci.org/api - The Robokop user interface API
* http://robokop.renci.org:6010/apidocs - The robokop-interfaces API
* http://robokop.renci.org:6011/apidocs - The robokop-rank API
* http://robokop.renci.org:7474 - NEO4j http interface
* bolt://robokop.renci.org:7687 - NEO4j bolt interface
* http://robokop.renci.org:5555 - UI to see the worker queues for the UI - Requires authentication
* http://robokop.renci.org:5556 - UI to see the worker queues for the builder - Requires authentication
* http://robokop.renci.org:5557 - UI to see the worker queues for the ranker - Requires authentication

## Setup Instructions 

### Installation
ROBOKOP uses several docker containers managed through docker-compose. Both should be installed and configured properly.

### Source Code Structure

We create a robokop directory and clone three repos into it: robokop, robokop-interfaces, and robokop-rank.

In the root directory, we create shared and logs diretories. 

Into the shared directory we copy a "robokop.env" file with environment variables. A template is included below.

This is our directory structure:
```
robokop
├── logs
├── robokop
├── robokop-interfaces
├── robokop-rank
└── shared
    └── robokop.env
```

### Environment settings

robokop.env looks like this:
```
#################### Locations of things ####################
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687

CACHE_PORT=6379
RESULTS_PORT=6380
BROKER_PORT=5672
BROKER_USER=murphy

POSTGRES_PORT=5432
POSTGRES_USER=murphy
POSTGRES_DB=robokop

ROBOKOP_HOST=127.0.0.1
RANKER_HOST=127.0.0.1
BUILDER_HOST=127.0.0.1
MANAGER_PORT=80
BUILDER_PORT=6010
RANKER_PORT=6011

# Services can be REACHED at these addresses. They should generally publish to 0.0.0.0.
NEO4J_HOST=127.0.0.1
CACHE_HOST=127.0.0.1
RESULTS_HOST=127.0.0.1
BROKER_HOST=127.0.0.1
POSTGRES_HOST=127.0.0.1
SUPERVISOR_HOST=127.0.0.1

CACHE_DB=0
MANAGER_RESULTS_DB=1
BUILDER_RESULTS_DB=2
RANKER_RESULTS_DB=3

MANAGER_SUPERVISOR_PORT=9001
BUILDER_SUPERVISOR_PORT=9002
RANKER_SUPERVISOR_PORT=9003
SUPERVISOR_USER=admin

COMPOSE_PROJECT_NAME=robokop

NUM_BUILDERS=4
NUM_RANKERS=4
#############################################################

####################### Secret stuff ########################
ADMIN_EMAIL=<your-email@x.org>
ADMIN_PASSWORD=----------------------------------

NEO4J_PASSWORD=----------------------------------
BROKER_PASSWORD=----------------------------------
POSTGRES_PASSWORD=----------------------------------
SUPERVISOR_PASSWORD=----------------------------------

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

### Build

Environemnts are configured in several docker containers managed by docker-compose.

* robokop/robokop/helpers - Common storage databases - Redis, Neo4j, Postgres
* robokop/robokop/deploy - UI API and web server
* robokop/robokop-interfaces/deploy - robokop-interfaces API server
* robokop/robokop-rank/deploy - robokop-interfaces API server


First we must build the containers. For each of robokop, robokop-interfaces, and robokop-rank,
* cd into <repo>/deploy
* docker-compose build

When those are all complete, we must start the helpers (storage containers).
* cd robokop/robokop/helpers
* docker-compose up

Then for each of robokop, robokop-interfaces, and robokop-rank,
* cd into <repo>/deploy
* docker-compose up

With all containers started you can now monitor each component using the urls below.

### Interfaces

* http://127.0.0.1 - The Robokop user interface
* http://127.0.0.1/api/ - The Robokop user interface API
* http://127.0.0.1:6010/apidocs - The robokop-interfaces API
* http://127.0.0.1:6011/apidocs - The robokop-rank API
* http://127.0.0.1:7474 - NEO4j http interface
* bolt://127.0.0.1:7687 - NEO4j bolt interface
* http://127.0.0.1:5555 - UI to see the queues for the UI - Requires authentication
* http://127.0.0.1:5556 - UI to see the queues for the builder - Requires authentication
* http://127.0.0.1:5557 - UI to see the queues for the ranker - Requires authentication



