#!/bin/sh

# Create Default RabbitMQ setup
( sleep 10 ; \

# Create users
# rabbitmqctl add_user <username> <password>
rabbitmqctl add_user admin "$ADMIN_PASSWORD" ; \
rabbitmqctl add_user "$BROKER_USER" "$BROKER_PASSWORD" ; \

# Set user rights
# rabbitmqctl set_user_tags <username> <tag>
rabbitmqctl set_user_tags admin administrator ; \

for vhost in "$@"
do
# Create vhosts
# rabbitmqctl add_vhost <vhostname>
rabbitmqctl add_vhost $vhost ; \

# Set vhost permissions
# rabbitmqctl set_permissions -p <vhostname> <username> ".*" ".*" ".*"
rabbitmqctl set_permissions -p $vhost admin ".*" ".*" ".*" ; \
rabbitmqctl set_permissions -p $vhost "$BROKER_USER" ".*" ".*" ".*" ; \
done
) &    
rabbitmq-server