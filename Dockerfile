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
ARG PUBLIC_API_URL

# Crear .env con las variables de Firebase para Vite
RUN echo "PUBLIC_FIREBASE_API_KEY=${PUBLIC_FIREBASE_API_KEY}" > .env && \
    echo "PUBLIC_FIREBASE_AUTH_DOMAIN=${PUBLIC_FIREBASE_AUTH_DOMAIN}" >> .env && \
    echo "PUBLIC_FIREBASE_PROJECT_ID=${PUBLIC_FIREBASE_PROJECT_ID}" >> .env && \
    echo "PUBLIC_FIREBASE_STORAGE_BUCKET=${PUBLIC_FIREBASE_STORAGE_BUCKET}" >> .env && \
    echo "PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" >> .env && \
    echo "PUBLIC_FIREBASE_APP_ID=${PUBLIC_FIREBASE_APP_ID}" >> .env && \
    echo "PUBLIC_API_URL=${PUBLIC_API_URL}" >> .env

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
# Stage 2: Nginx
# ============================================
FROM nginx:1.27-alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

# Copiar el template de nginx (con variables sin substituir)
COPY nginx.conf /etc/nginx/conf.d/nginx.conf.template

# Copiar el entrypoint que substituye variables
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# chown only the files we actually need
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]