# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Build args para Firebase y API
ARG PUBLIC_FIREBASE_API_KEY
ARG PUBLIC_FIREBASE_AUTH_DOMAIN
ARG PUBLIC_FIREBASE_PROJECT_ID
ARG PUBLIC_FIREBASE_STORAGE_BUCKET
ARG PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG PUBLIC_FIREBASE_APP_ID
ARG PUBLIC_API_URL=/api
ARG PUBLIC_API_BASE_URL=/api

# Crear .env con las variables de Firebase para Vite
RUN echo "PUBLIC_FIREBASE_API_KEY=${PUBLIC_FIREBASE_API_KEY}" > .env && \
    echo "PUBLIC_FIREBASE_AUTH_DOMAIN=${PUBLIC_FIREBASE_AUTH_DOMAIN}" >> .env && \
    echo "PUBLIC_FIREBASE_PROJECT_ID=${PUBLIC_FIREBASE_PROJECT_ID}" >> .env && \
    echo "PUBLIC_FIREBASE_STORAGE_BUCKET=${PUBLIC_FIREBASE_STORAGE_BUCKET}" >> .env && \
    echo "PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" >> .env && \
    echo "PUBLIC_FIREBASE_APP_ID=${PUBLIC_FIREBASE_APP_ID}" >> .env && \
    echo "PUBLIC_API_URL=${PUBLIC_API_URL}" >> .env && \
    echo "PUBLIC_API_BASE_URL=${PUBLIC_API_BASE_URL}" >> .env

# Deps layer — cached unless package files change
COPY package*.json astro.config.mjs tsconfig*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Source layer — invalidated only when src actually changes
COPY src/ ./src/
COPY public/ ./public/

# Build
RUN npm run build

# ============================================
# Stage 2: Node SSR + Nginx reverse proxy in one container
# ============================================
# This stage uses a minimal Alpine image with both Node and nginx:
#   - Node SSR runs in the background (started by the entrypoint) on :3000
#   - nginx serves as reverse proxy on :80:
#       - /api/* and /auth/*  → NestJS backend (BACKEND_URL)
#       - everything else     → Node SSR upstream (127.0.0.1:3000)
# This way the container exposes a single :80 port and the browser sees
# one origin (the container), keeping the auth-cookie-refresh contract
# intact (SameSite=Strict works because everything is same-origin).
# ============================================
FROM node:22-alpine AS production

# Install nginx + envsubst on top of the official Node 22 alpine image.
# We keep the Node 22 guarantee from the official image and layer nginx
# for the reverse proxy.
RUN apk add --no-cache nginx gettext \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

WORKDIR /app

# Astro SSR bundle and dependencies.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# nginx config. We replace the entire main nginx.conf with our template
# so the http { server { ... } } wrapper is valid at the top level.
# Substituting via envsubst at entrypoint keeps BACKEND_URL the only
# variable to interpolate.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf.template

# Entrypoint that:
#   1. Generates config.json with the Firebase runtime values.
#   2. Substitutes ${BACKEND_URL} into the nginx template.
#   3. Starts Node SSR in the background.
#   4. Starts nginx in the foreground.
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
