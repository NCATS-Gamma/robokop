### nginx image that can be configured for robokop services via env variables.
FROM nginx:latest

COPY ./startup.sh /startup.sh

COPY ./configs/default.conf.template /etc/nginx/templates/
COPY ./configs/default-no-ssl.conf.template /etc/nginx/templates
COPY ./configs/ssl.conf /etc/nginx/ssl/ssl.conf

ENTRYPOINT /startup.sh