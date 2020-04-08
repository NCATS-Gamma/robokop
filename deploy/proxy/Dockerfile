### nginx image that can be configured for robokop services via env variables.
FROM nginx:latest

COPY ./startup.sh /startup.sh

COPY ./configs/ /etc/nginx/templates/

ENTRYPOINT /startup.sh