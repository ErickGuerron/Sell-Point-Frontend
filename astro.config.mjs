// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

import analogjsangular from '@analogjs/astro-angular';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
//
// Adapter selection:
//   - Vercel deploy (`VERCEL=1` is set by the Vercel build pipeline):
//     use `@astrojs/vercel` so the bundle emits Vercel serverless
//     functions and routes resolve natively. The `vercel.json` at
//     the project root layers rewrites and security headers on top.
//   - Docker / standalone Node (`npm run dev` and Docker images):
//     use `@astrojs/node` standalone so the bundle emits
//     `dist/server/entry.mjs` and `nginx.conf` can reverse-proxy to
//     it. The `nginx.conf` at the project root provides the
//     /api/* and /auth/* rewrites in that environment.
//
// Both adapters are installed as devDependencies. The runtime switch
// is a single ternary — no second config file to keep in sync.
const adapter = process.env.VERCEL === '1'
  ? vercel()
  : node({ mode: 'standalone' });

export default defineConfig({
  output: 'server',
  adapter,
  integrations: [analogjsangular()],
  devToolbar: {
    enabled: false,
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  vite: {
    plugins: [tailwindcss(), authCookieRefreshDevProxy()],
    optimizeDeps: {
      include: [
        '@angular/common',
        '@angular/common/http',
        '@angular/core',
        '@angular/forms',
        '@angular/platform-browser',
        'rxjs',
        'rxjs/operators',
      ],
    },
  }
});

/**
 * Dev-only proxy plugin for /auth and /api.
 *
 * The declarative `vite.server.proxy` API works for most cases but has a
 * known Vite/http-proxy quirk: when forwarding cross-origin responses
 * (browser at :4321, target at :3001), it sometimes drops the
 * `Set-Cookie` header AND fails to forward the browser's `Cookie` header
 * back to the backend on subsequent requests. Both break the
 * auth-cookie-refresh flow:
 *   - Without Set-Cookie propagation: the browser never receives the
 *     `refreshToken` cookie after login.
 *   - Without Cookie forwarding: subsequent `POST /auth/refresh` calls
 *     hit the backend with no `Cookie` header → 401 → `restoreSession`
 *     redirects to `/auth`.
 *
 * This plugin uses Vite's `configureServer` hook to handle the proxy
 * manually using Node's built-in `fetch` and the native `ServerResponse`
 * API. It does NOT use any Express-style `res.status()` / `res.append()`
 * helpers — Vite's `res` is a raw `http.ServerResponse`, and those
 * methods do not exist on it.
 *
 * Path matching is EXACT, not prefix-based: only paths that start with
 * a known backend endpoint prefix are proxied. The Astro SSR-rendered
 * `/auth` login page is NOT proxied (it would otherwise intercept
 * GET /auth and try to fetch it from the backend, which 404s).
 *
 * Production uses a real reverse proxy (Vercel rewrite / Cloudflare
 * Worker / nginx / Caddy) — see docs/deploy/cookie-auth.md. This
 * plugin only runs in `astro dev`.
 */
function authCookieRefreshDevProxy() {
  return {
    name: 'auth-cookie-refresh-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      // eslint-disable-next-line no-console
      console.log('[auth-cookie-refresh-dev-proxy] loaded and configured server');
      const BACKEND = 'http://localhost:3000';
      // Exact backend endpoint prefixes. Adding a path here means
      // `^/auth/<x>` and `^/api/<x>` get proxied; bare `/auth` and
      // bare `/api` do NOT (those are SSR pages or 404s in the SPA).
      const PROXIED_PATTERNS = [
        /^\/auth\/(login|logout|refresh|me|login-google|google|callback|register|password-reset|google-link)(?:\/|$|\?)/,
        /^\/api\//,
      ];

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const matches = PROXIED_PATTERNS.some((re) => re.test(url));
        if (!matches) return next();

        // Strip the '/api' prefix to match production Nginx rewrite behavior
        const cleanUrl = url.startsWith('/api/') ? url.replace(/^\/api\//, '/') : url;
        const targetUrl = new URL(cleanUrl, BACKEND);

        console.log(`[proxy] Request: ${req.method} ${url} -> ${targetUrl.toString()}`);
        console.log(`[proxy] Incoming cookie header:`, req.headers.cookie);

        // Build the upstream request. Preserve the browser's Host header
        // so the backend treats this as a same-origin request against
        // FRONTEND_URL (the backend NestJS CORS / allowed-origins check
        // uses FRONTEND_URL=http://localhost:4321). Strip the hop-by-hop
        // headers that Node's fetch handles itself.
        const headers = { ...req.headers };
        delete headers['content-length'];
        delete headers['connection'];
        // Forward the browser's Cookie header verbatim — Vite's
        // declarative proxy sometimes strips it on cross-origin dev.
        if (req.headers.cookie) {
          headers.cookie = req.headers.cookie;
        }
        // Tell the backend which host the browser thinks it's talking to,
        // so its CORS / origin checks resolve correctly.
        headers['x-forwarded-host'] = req.headers.host ?? 'localhost:4321';
        headers['x-forwarded-proto'] = 'http';

        try {
          const upstream = await fetch(targetUrl, {
            method: req.method,
            headers,
            // @ts-ignore — Node 18+ fetch supports duplex for body streaming
            duplex: 'half',
            body:
              req.method === 'GET' || req.method === 'HEAD'
                ? undefined
                : new ReadableStream({
                    start(controller) {
                      req.on('data', (chunk) => controller.enqueue(chunk));
                      req.on('end', () => controller.close());
                      req.on('error', (err) => controller.error(err));
                    },
                  }),
          });

          console.log(`[proxy] Response status from upstream: ${upstream.status}`);
          const setCookieHeader = upstream.headers.get('set-cookie');
          if (setCookieHeader) {
            console.log(`[proxy] Upstream Set-Cookie header:`, setCookieHeader);
          }

          // NATIVE ServerResponse API (no Express). `res.status` does
          // not exist on this object — that was the 502 bug.
          res.statusCode = upstream.status;
          upstream.headers.forEach((value, key) => {
            const lower = key.toLowerCase();
            if (lower === 'set-cookie') {
              // A Set-Cookie value may itself contain multiple cookies
              // separated by `, ` — but Node fetch joins them with
              // `, ` too, so we need to split on `, <name>=` boundaries.
              const normalized = value
                .split(/,\s*(?=[a-zA-Z0-9_-]+=)/)
                .map((c) => c.replace(/;\s*Domain=[^;]+/i, ''))
                .join(', ');
              const existing = res.getHeader('Set-Cookie');
              if (existing) {
                res.setHeader('Set-Cookie', [].concat(existing, normalized));
              } else {
                res.setHeader('Set-Cookie', normalized);
              }
            } else if (
              lower !== 'content-encoding' &&
              lower !== 'transfer-encoding' &&
              lower !== 'connection'
            ) {
              res.setHeader(key, value);
            }
          });

          if (upstream.body) {
            const reader = upstream.body.getReader();
            const pump = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
              }
              res.end();
            };
            await pump();
          } else {
            res.end();
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[auth-cookie-refresh-dev-proxy] upstream fetch failed', err);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'dev_proxy_upstream_failed', detail: String(err) }));
          } else {
            res.end();
          }
        }
      });
    },
  };
}
