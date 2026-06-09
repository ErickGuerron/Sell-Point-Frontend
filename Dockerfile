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
# Stage 2: Node SSR + Nginx reverse proxy
# ============================================
# Astro builds with `output: 'server'` and the @astrojs/node adapter,
# which produces a Node SSR bundle at dist/server/entry.mjs. nginx is
# used as a reverse proxy:
#   - /api/* and /auth/* → BACKEND_URL (NestJS)
#   - everything else    → Node SSR on :3000
# ============================================
FROM node:22-alpine AS node-ssr

WORKDIR /app

# Copy the Astro SSR bundle from the builder.
# node_modules are also needed because entry.mjs imports from there.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Healthcheck hits the Node SSR — nginx isn't on the network yet.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "./dist/server/entry.mjs"]
