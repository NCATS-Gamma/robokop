# adapted from:
# http://mpas.github.io/post/2015/06/11/20150611_docker-rabbitmq-default-users/

FROM rabbitmq:3.7.5-management

# Add script to create default users / vhosts
ADD init.sh /init.sh

# Set correct executable permissions
RUN chmod +x /init.sh

# Define default command
CMD ["/init.sh"]

# docker run --rm=true --name my_rabbitmq_container -p 5672:5672 -p 15672:15672 -it --env ADMIN_PASSWORD="$ADMIN_PASSWORD" --env BROKER_USER="$BROKER_USER" --env BROKER_PASSWORD="$BROKER_PASSWORD" --hostname robokop my_rabbitmq_image