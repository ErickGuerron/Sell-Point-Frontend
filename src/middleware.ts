/**
 * Astro server-side middleware — auth gate.
 *
 * Slice 2 of the auth-cookie-refresh change moved the in-component
 * `restoreSession()` check to a single, server-side guard. The pattern
 * previously relied on every page calling `restoreSession()` in
 * `ngOnInit`, which was fragile (forget a page → unprotected) and let
 * the SSR render an empty shell before redirecting.
 *
 * This middleware runs BEFORE any page is rendered. If the request is
 * for a protected path and the browser has no valid `refreshToken`
 * cookie, the request is short-circuited with a 302 redirect to
 * `/auth`. The browser never sees the protected page's HTML.
 *
 * The check is intentionally minimal: it only verifies the cookie is
 * PRESENT. The backend's `/auth/refresh` endpoint is the source of
 * truth for whether the cookie is valid; this middleware just
 * front-loads the unauthenticated-user redirect so we don't ship the
 * page shell + the SPA hydration overhead for users who aren't
 * logged in.
 *
 * Public paths (login, password recovery, public assets, API proxy
 * passthrough, etc.) are allowed through unconditionally.
 */
import { defineMiddleware } from 'astro:middleware';

const PROTECTED_PATHS = new Set<string>([
  '/dashboard',
  '/invoices',
  '/create-invoice',
  '/customers',
  '/products',
  '/categories',
  '/employees',
  '/profile',
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = new URL(context.request.url).pathname;

  // Allow public paths through without checking the cookie.
  if (!PROTECTED_PATHS.has(pathname)) {
    return next();
  }

  // Slice 2 contract: the only auth signal we trust server-side is the
  // HttpOnly `refreshToken` cookie. If it isn't there, the user isn't
  // logged in (or their session has been cleared by logout).
  const cookies = context.request.headers.get('cookie') ?? '';
  const hasRefreshCookie = /(?:^|;\s*)refreshToken=/.test(cookies);

  if (!hasRefreshCookie) {
    return context.redirect('/auth', 302);
  }

  return next();
});
