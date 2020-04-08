#!/bin/bash
template=/etc/nginx/templates/default.conf.template
if [ "$1" == "no-ssl" ]; then
    echo "RUNNING NO SLL"
    template=/etc/nginx/templates/default-no-ssl.conf.template
fi

env_vars=$(awk 'BEGIN {for(v in ENVIRON) printf "$%s", v }') 
echo "Creating default.conf file from template"
# avoid substituting variables not defined in env. Had problem with some nginx variables being replaced.
echo $env_vars
envsubst $env_vars < ${template} > /etc/nginx/conf.d/default.conf

echo "Starting nginx daemon..."
exec nginx -g 'daemon off;'