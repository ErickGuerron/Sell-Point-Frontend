# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

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