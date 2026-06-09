#!/bin/sh
# Entrypoint para nginx + Node SSR
# 1. Genera config.json con valores de Firebase (runtime).
# 2. Sustituye ${BACKEND_URL} en el template de nginx.
# 3. Arranca el Node SSR (Astro) en background sobre :3000.
# 4. Arranca nginx en foreground sobre :80.

set -e

# Generar config.json para Firebase en runtime
mkdir -p /usr/share/nginx/html
cat > /usr/share/nginx/html/config.json <<EOF
{"PUBLIC_FIREBASE_API_KEY":"${PUBLIC_FIREBASE_API_KEY}","PUBLIC_FIREBASE_AUTH_DOMAIN":"${PUBLIC_FIREBASE_AUTH_DOMAIN}","PUBLIC_FIREBASE_PROJECT_ID":"${PUBLIC_FIREBASE_PROJECT_ID}","PUBLIC_FIREBASE_STORAGE_BUCKET":"${PUBLIC_FIREBASE_STORAGE_BUCKET}","PUBLIC_FIREBASE_MESSAGING_SENDER_ID":"${PUBLIC_FIREBASE_MESSAGING_SENDER_ID}","PUBLIC_FIREBASE_APP_ID":"${PUBLIC_FIREBASE_APP_ID}"}
EOF

# Substituir BACKEND_URL en nginx.conf
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Arranca Node SSR (Astro) en background
echo "[entrypoint] Starting Node SSR (Astro) on :3000..."
HOST=0.0.0.0 PORT=3000 node /app/dist/server/entry.mjs &
NODE_PID=$!

# Espera un poco para que Node esté listo antes de que nginx reciba tráfico
sleep 3

# Trap para limpiar Node si el container se detiene
trap "echo '[entrypoint] Stopping Node SSR (pid='$NODE_PID')...'; kill $NODE_PID 2>/dev/null || true" EXIT TERM INT

# Arranca nginx en foreground
echo "[entrypoint] Starting nginx on :80..."
exec nginx -g 'daemon off;'
