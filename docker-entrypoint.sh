#!/bin/sh
# Entrypoint para nginx - substituye variables de entorno en la config

# Substituir BACKEND_URL en nginx.conf
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
