#!/bin/sh
# Entrypoint para nginx - substituye variables de entorno en la config

# Generar config.json para Firebase en runtime
cat > /usr/share/nginx/html/config.json <<EOF
{"PUBLIC_FIREBASE_API_KEY":"${PUBLIC_FIREBASE_API_KEY}","PUBLIC_FIREBASE_AUTH_DOMAIN":"${PUBLIC_FIREBASE_AUTH_DOMAIN}","PUBLIC_FIREBASE_PROJECT_ID":"${PUBLIC_FIREBASE_PROJECT_ID}","PUBLIC_FIREBASE_STORAGE_BUCKET":"${PUBLIC_FIREBASE_STORAGE_BUCKET}","PUBLIC_FIREBASE_MESSAGING_SENDER_ID":"${PUBLIC_FIREBASE_MESSAGING_SENDER_ID}","PUBLIC_FIREBASE_APP_ID":"${PUBLIC_FIREBASE_APP_ID}"}
EOF

# Substituir BACKEND_URL en nginx.conf
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
