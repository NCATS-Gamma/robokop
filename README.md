# ROBOKOP Ranking and User Interface

The user interface modules for ROBOKOP, an NCATS Reasoner.

![Example Knowledge graph](./cover.png?raw=true)

### For additional information see the following documentation.
* [User Interface](./doc/ui/ui_doc.md)
* [Ranking](./doc/ranking/ranking_doc.md)
* [Web Server](./doc/webserver/webserver_doc.md )

### Running 

## Get

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
├── robokop.env
└── shared
```

## Environment settings

Robokop env looks like this:
```
#################### Locations of things ####################
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687

REDIS_PORT=6379

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
REDIS_HOST=127.0.0.1
POSTGRES_HOST=127.0.0.1
FLOWER_HOST=127.0.0.1
SUPERVISOR_HOST=127.0.0.1

GREENT_REDIS_DB=0
MANAGER_REDIS_DB=1
BUILDER_REDIS_DB=2
RANKER_REDIS_DB=3

FLOWER_ADDRESS=0.0.0.0
MANAGER_FLOWER_PORT=5555
BUILDER_FLOWER_PORT=5556
RANKER_FLOWER_PORT=5557
FLOWER_USER=admin

MANAGER_SUPERVISOR_PORT=9001
BUILDER_SUPERVISOR_PORT=9002
RANKER_SUPERVISOR_PORT=9003
SUPERVISOR_USER=admin

COMPOSE_PROJECT_NAME=robokop
#############################################################

####################### Secret stuff ########################
ADMIN_EMAIL=<your-email@x.org>
ADMIN_PASSWORD=----------------------------------

NEO4J_PASSWORD=----------------------------------

FLOWER_PASSWORD=----------------------------------

SUPERVISOR_PASSWORD=----------------------------------

ROBOKOP_SECRET_KEY=----------------------------------
ROBOKOP_SECURITY_PASSWORD_SALT=----------------------------------

ROBOKOP_MAIL_SERVER=smtp.mailgun.org
ROBOKOP_MAIL_USERNAME=----------------------------------
ROBOKOP_MAIL_PASSWORD=----------------------------------
ROBOKOP_DEFAULT_MAIL_SENDER=----------------------------------
ROBOKOP_SECURITY_EMAIL_SENDER=----------------------------------
#############################################################

```
You'll need to supply values for the secret things at the end.

## Build

For each of robokop, robokop-interfaces, and robokop-rank,
* cd into <repo>/deploy
* docker-compose build

Then
* cd robokop/robokop/helpers
* docker-compose up

When that's ready, for each of robokop, robokop-interfaces, and robokop-rank,
* cd into <repo>/deploy
* docker-compose up
  
## Interfaces

Visit 
* http://127.0.0.1 - The Robokop user interface
* http://127.0.0.1:6010/apidocs - The builder API
* http://127.0.0.1:6011/apidocs - The ranker API
* http://127.0.0.1:5555 - Flower UI to Celery
* http://127.0.0.1:5556 - Flower UI to Celery


