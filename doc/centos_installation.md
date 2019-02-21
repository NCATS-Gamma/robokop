# ROBOKOP Prerequisite Installation on Centos7

## Requirements
Robokop installations require docker, docker-compose and node.js. This is a collection of information for installing these items on Centos7.


## Node.js
Instructions for Node.js were found (here)[https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-a-centos-7-server].

## Docker
Docker can be installed through Yum by adding a repository

```
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

sudo yum-config-manager \
  --add-repo \
  https://download.docker.com/linux/centos/docker-ce.repo

sudo yum install docker-ce
```

## Post Docker Installation
After docker is installed some group settings must be modified and the deamon must be started. See this (link)[https://docs.docker.com/install/linux/linux-postinstall/].

## docker-compose

Docker compose is a direct download with no additional setup required.

```
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

## tmux
tmux is not required but may be beneficial for running multiple docker-compose sets. Installation is easy via yum.

```
sudo yum install tmux
```