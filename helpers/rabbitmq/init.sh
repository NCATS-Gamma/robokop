#!/bin/sh

# Create Default RabbitMQ setup
( sleep 10 ; \

# Create users
# rabbitmqctl add_user <username> <password>
rabbitmqctl add_user admin "$ADMIN_PASSWORD" ; \
rabbitmqctl add_user murphy "to-be-removed" ; \
rabbitmqctl clear_password murphy ; \

# Set user rights
# rabbitmqctl set_user_tags <username> <tag>
rabbitmqctl set_user_tags admin administrator ; \

# Create vhosts
# rabbitmqctl add_vhost <vhostname>
rabbitmqctl add_vhost robokop ; \

# Set vhost permissions
# rabbitmqctl set_permissions -p <vhostname> <username> ".*" ".*" ".*"
rabbitmqctl set_permissions -p robokop admin ".*" ".*" ".*" ; \
rabbitmqctl set_permissions -p robokop murphy ".*" ".*" ".*" ; \
) &    
rabbitmq-server $@