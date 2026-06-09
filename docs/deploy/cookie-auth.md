# Cookie Auth — Frontend Deploy Guide

This guide covers deploying the Astro + Angular SPA so the **`refreshToken`
HttpOnly cookie** issued by the backend is honored by the browser. The
cookie contract is documented in
[`../../Sell-Point-PDSW/openspec/specs/auth-secure-cookie-session/spec.md`](../../Sell-Point-PDSW/openspec/specs/auth-secure-cookie-session/spec.md),
and the backend deploy counterpart lives at
[`../../Sell-Point-PDSW/docs/deploy/cookie-auth.md`](../../Sell-Point-PDSW/docs/deploy/cookie-auth.md).

> **TL;DR** — the SPA and the API must share a **single origin** in
> production. On Vercel, the `vercel.json` rewrites proxy `/auth/*` and
> `/api/*` to the backend host. On Render, a single web service
> (with nginx or a Cloudflare Worker in front) serves both. The dev
> workflow uses Astro's Vite `server.proxy` (see
> [`astro.config.mjs`](../../astro.config.mjs)) so the same root-relative
> URLs work in dev and prod.

---

## Local preview with nginx (production-equivalent)

The dev proxy plugin in `astro.config.mjs` (`authCookieRefreshDevProxy`,
`apply: 'serve'`) only runs in `astro dev`. To validate that the
**production bundle** behaves identically, run nginx as a local sidecar
that mirrors the production proxy rules.

### Option A — nginx in Docker (recommended)

```bash
# 1. Build the production bundle
npm run build

# 2. Start the Astro standalone server (the production bundle)
npm run preview &

# 3. Start nginx in Docker with the included config
docker run --rm --name sell-point-nginx -p 8080:80 \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -e BACKEND_URL=http://host.docker.internal:3001 \
  nginx:1.27-alpine
```

On Windows + Docker Desktop, `host.docker.internal` resolves to the host
machine where the backend runs. On Linux without Docker Desktop,
replace it with the host IP (`hostname -I | awk '{print $1}'`) or run
nginx natively.

Point your browser to **`http://localhost:8080`**. The flow should
match `http://localhost:4321` in dev (cookie sets, refresh works, etc.).

### Option B — Full local stack with `docker-compose.deploy.yml`

The backend repo at `../Sell-Point-PDSW/` includes a full-stack
`docker-compose.deploy.yml` that brings up the complete production-equivalent
stack (backend + frontend + postgres + redis), all on the same Docker
network with healthchecks. To validate the auth-cookie-refresh flow
end-to-end against the production-style proxy:

```bash
cd ../Sell-Point-PDSW
docker compose -f docker-compose.deploy.yml up --build
```

The frontend container uses the same `nginx.conf` from this directory
(mounted at build time via the frontend `Dockerfile` Stage 2), so the
proxy rules tested in this stack are byte-for-byte identical to
Option A above. Hit `http://localhost` (port 80, exposed by the
frontend container) — the flow should match `http://localhost:8080`
from Option A and `http://localhost:4321` in dev.

The backend image in `docker-compose.deploy.yml` is `meliodasdev/sellpoint-backend:latest`
(prebuilt). For local iteration against a freshly built backend,
replace it with `build: { context: . }` in that compose file.

### Prerequisites for nginx in Docker

The `host.docker.internal` host works out-of-the-box on Docker Desktop
for Windows and macOS. On Linux, either enable it in
`/etc/docker/daemon.json` (`"host.docker.internal": "host-gateway"` in
the `network` driver options) or pass the host IP explicitly.

---

## Files in this deploy guide

- **`nginx.conf`** (this directory's parent) — production nginx config used in the frontend Docker image and as a local sidecar in Option A.
- **`vercel.json`** (this directory's parent) — Vercel rewrites for the Vercel + Render deploy pattern.
- **`astro.config.mjs`** (this directory's parent) — dev proxy plugin (`authCookieRefreshDevProxy`), the dev-time equivalent of nginx. Only runs in `astro dev` (`apply: 'serve'`); ignored in build/preview.
- **`../Sell-Point-PDSW/docker-compose.deploy.yml`** — full-stack compose with backend, frontend, postgres, and redis. Use for Option B.
- **`../Sell-Point-PDSW/docs/deploy/cookie-auth.md`** — backend deploy counterpart (nginx + Caddy for backend-only deploys).

---

## Why single-origin matters

The `refreshToken` cookie is issued with `Path=/`, `SameSite=Strict`,
`HttpOnly`, and (in production) `Secure`. If the SPA loads from
`app.example.com` and the API lives on `api.example.com`, the browser
will **not** send the cookie on `/auth/refresh` (cross-site, same-origin
policy). Symptom: the user is bounced to `/auth` every 15 minutes
(the access-token TTL).

**Deploy requirement**: SPA and API on the same origin. The
reverse-proxy layer (Vercel rewrites, Cloudflare Worker, Render + nginx)
fronts both.

---

## `ALLOWED_ORIGINS` note

The backend CORS config (`Sell-Point-PDSW/src/config/cors.config.ts`)
allowlists origins via `ALLOWED_ORIGINS`. Because the SPA and API share
the same origin in production, CORS barely applies. The dev exception
is `http://localhost:4321` (Astro) calling `http://localhost:3001`
(backend) — the dev proxy in [`astro.config.mjs`](../../astro.config.mjs)
makes those calls look same-origin to the browser, so the backend
`credentials: true` + `ALLOWED_ORIGINS` allowlist both stay in effect.

**Action**: in production, set `ALLOWED_ORIGINS` to the single public
origin (e.g. `https://app.sellpoint.com`). Do NOT add a second origin
for the API host — there is no second host.

---

## Vercel rewrite (recommended for Vercel deploys)

Vercel serves the Astro static + serverless output from a single
project. The `vercel.json` at the repo root defines rewrites that
proxy `/auth/*` and `/api/*` to the backend host. The SPA loads from
the same origin so the cookie travels automatically.

### `vercel.json`

```json
{
  "rewrites": [
    { "source": "/auth/(.*)", "destination": "https://api.sellpoint.com/auth/$1" },
    { "source": "/api/(.*)",  "destination": "https://api.sellpoint.com/api/$1"  }
  ]
}
```

> **Note**: the destination host is the **backend's public URL**
> (e.g. `https://sell-point-pdsw.onrender.com`). It is NOT the
> Vercel domain — Vercel would loop the request back to itself.

### `astro.config.mjs` (already wired in dev)

The same Vite proxy that we use in dev is harmless in prod (Vite
dev server only). For prod, the Vercel rewrite is the source of truth.

```js
// vite.server.proxy — dev-only; production rewrites live in vercel.json
server: {
  proxy: {
    '/auth': { target: 'http://localhost:3001', changeOrigin: true, secure: false },
    '/api':  { target: 'http://localhost:3001', changeOrigin: true, secure: false },
  },
},
```

### Vercel project environment variables

Vercel sets a few env vars automatically. The ones that need to be
set manually are listed below.

| Variable | Scope | Value | Why |
|---|---|---|---|
| `SSR_API_URL` | Production, Preview | `https://sell-point-pdsw.onrender.com` (your backend's public URL) | The Astro serverless function runs server-side during SSR. It cannot reach `localhost:3001` (the backend is on Render, not on Vercel's network). `resolveApiBaseUrl()` checks this var first when running SSR and falls back to `PUBLIC_API_URL` / `localhost:3001` otherwise. |
| `PUBLIC_API_URL` | Production, Preview | `/api` (relative) | Used by the browser-side fetch layer. Always relative so the browser stays on the Vercel origin and the Vercel rewrites handle the proxy. |

You can set these from the Vercel Dashboard → Project → Settings →
Environment Variables, or via the Vercel CLI
[`vercel env add`](https://vercel.com/docs/cli/env).

**Without `SSR_API_URL`**: the SSR step (`getAccessTokenForRequest`,
`fetchJsonWithAuth`) calls `fetch('http://localhost:3001/...')` which
returns `ECONNREFUSED` inside the serverless function. The page
responds with 500 Internal Server Error and the user sees a blank
dashboard after login. This is the most common deploy-time failure
mode for this change.

**With `SSR_API_URL`**: the SSR fetch goes to your backend over HTTPS,
the backend issues an access token, and the page renders with data.
The browser-side flow is unaffected because the browser uses
`PUBLIC_API_URL` (always relative), which the Vercel rewrites forward
to the backend.

### What this gets you

- Single origin: `https://app.sellpoint.com` serves the SPA, `/auth/*`
  and `/api/*` reach the backend transparently.
- `Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict; Secure`
  is honored because the response is same-origin.
- Dev (localhost) and prod (Vercel) use the same root-relative URL
  scheme (`/auth/login`, `/auth/refresh`).

---

## Cloudflare Worker (alternative to Vercel rewrites)

If the SPA is hosted on Cloudflare Pages, a Worker in front of Pages
can route `/auth/*` and `/api/*` to the backend origin.

```ts
// worker.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) {
      const backendUrl = new URL(url.pathname + url.search, env.BACKEND_ORIGIN);
      return fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
      });
    }
    return env.ASSETS.fetch(request);
  },
};
```

Bind `BACKEND_ORIGIN` to `https://api.sellpoint.com` in `wrangler.toml`.
The Worker preserves the request `Cookie` header so the refresh cookie
travels on `/auth/refresh`.

---

## Render (single web service with nginx in front)

Render does not have a "rewrites" feature like Vercel. The cleanest
path is a single web service that runs an nginx process in front of
the Astro Node output and proxies to the backend.

```nginx
# /etc/nginx/conf.d/sellpoint.conf
upstream sellpoint_backend { server 127.0.0.1:3001; keepalive 16; }
upstream sellpoint_frontend { server 127.0.0.1:3000; keepalive 16; }

server {
  listen 80;
  server_name app.sellpoint.com;

  location /auth/ {
    proxy_pass         http://sellpoint_backend;
    proxy_http_version 1.1;
    proxy_set_header   Host                $host;
    proxy_set_header   X-Real-IP           $remote_addr;
    proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto   $scheme;
    proxy_pass_request_headers on;
    proxy_buffering off;
  }

  location /api/ {
    proxy_pass         http://sellpoint_backend;
    proxy_http_version 1.1;
    proxy_set_header   Host                $host;
    proxy_set_header   X-Real-IP           $remote_addr;
    proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto   $scheme;
    proxy_pass_request_headers on;
    proxy_buffering off;
  }

  location / {
    proxy_pass         http://sellpoint_frontend;
    proxy_http_version 1.1;
    proxy_set_header   Host                $host;
    proxy_set_header   X-Real-IP           $remote_addr;
    proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto   $scheme;
  }
}
```

The `Dockerfile` at the repo root already runs nginx in front of the
Astro Node output (see `nginx.conf` in the repo root).

---

## Astro dev proxy (already wired)

The dev proxy in [`astro.config.mjs`](../../astro.config.mjs) forwards
`/auth/*` and `/api/*` from `http://localhost:4321` to
`http://localhost:3001` so the SPA can issue root-relative requests
(`/auth/login`, `/auth/refresh`, `/api/...`) and the browser treats
them as same-origin. This is the dev workaround for the same-origin
cookie requirement; production uses a real reverse proxy as above.

The target port (`3001`) matches the backend's `PORT` in
`Sell-Point-PDSW/.env`. If you change that, update
`astro.config.mjs` to match.

---

## Cross-link to backend deploy doc

For nginx / Caddy server-block examples, `cookie.*` env-var table, and
the cross-subdomain warning, see
[`../../Sell-Point-PDSW/docs/deploy/cookie-auth.md`](../../Sell-Point-PDSW/docs/deploy/cookie-auth.md).
The two docs are deliberately complementary: this one covers where
the SPA is deployed, the backend one covers how the cookie contract
is honored at the NestJS layer.

---

## Cross-subdomain warning (do NOT do this)

If you accidentally deploy SPA on `app.sellpoint.com` and API on
`api.sellpoint.com`, the `refreshToken` cookie will be set on
`app.sellpoint.com` and **will not be sent** to `api.sellpoint.com`.
Same fix as the backend doc: stay single-origin, or accept a
`SameSite=Lax` cookie with `Domain=.sellpoint.com` plus a CSRF
strategy that survives the weaker `SameSite` setting. **Preferred**:
single origin.

---

## Related

- [`../../Sell-Point-PDSW/openspec/specs/auth-secure-cookie-session/spec.md`](../../Sell-Point-PDSW/openspec/specs/auth-secure-cookie-session/spec.md) — Given/When/Then contract.
- [`../../Sell-Point-PDSW/docs/deploy/cookie-auth.md`](../../Sell-Point-PDSW/docs/deploy/cookie-auth.md) — backend deploy counterpart.
- [`astro.config.mjs`](../../astro.config.mjs) — dev proxy.
- Spec file `openspec/changes/auth-cookie-refresh/specs/auth-secure-cookie-session/spec.md` — change-local spec mirror.
