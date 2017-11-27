# PROTOCOP - Web Server Setup Instructions

The PROTOCOP UI is web based with a `Flask` server running inside of `gunicorn` within a docker container. The user interface is written using React and the build process uses webpack. This document contains a list of steps that were used to install the software.


## ssh to NCATS server
`ssh tyrosine.ncats.io`

## Install docker
https://docs.docker.com/engine/installation/linux/docker-ce/debian/#install-docker-ce-1

## Get docker image
`docker pull patrickkwang/reasoner-prototype`

## Run docker image, opening ports 5000, 7474, and 7687
`docker run -it -p 7474:7474 -p 7687:7687 -p 5000:5000 patrickkwang/reasoner-prototype bash`

## Set correct server self-address
`cd protocop-rank`
`sed -i -e 's/localhost/tyrosine.ncats.io/' config.json`

## Build the user interface with webpack
`npm run webpack`

## Start Flask server inside of gunicorn
`nohup gunicorn -c serverConfig.py python.wsgi:app`

## Setach from docker container and close ssh session
`[CTRL-P], [CTRL-Q]`
`exit`

