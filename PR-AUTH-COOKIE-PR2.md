# PR #2 — Auth Secure Cookie Session (frontend, Slice 2 of 2)

## Summary

This PR is the **frontend slice** of the `auth-cookie-refresh` change
(stacked-to-develop, PR #2 of 2). It assumes PR #1 (backend cookie
contract + `/auth/logout` endpoint) is **already merged to `develop`**.
The frontend now stores the short-lived access token in an Angular
signal (`AuthTokenStore`, in-memory only) and reads the refresh token
exclusively from the `HttpOnly` `SameSite=Strict` cookie set by the
backend. There are **no JS-readable copies of either token**:
`localStorage` no longer carries the refresh token (it never did post
slice 1) or the access token, and the `billflow-session` cookie no
longer carries either token either — only the non-secret identity
fields (`displayName`/`role`/`theme`), and only in a defensive read
path used by SSR frontmatter.

The `AuthHttpService` is rewritten to call `POST /auth/refresh` with
no body and `credentials: 'include'`; the cookie travels automatically.
`POST /auth/logout` is called by a new `AuthHttpService.logout()`
helper that clears both stores and navigates to `/auth`. SSR data
loaders forward the inbound `Cookie` header to `/auth/refresh` so the
backend can rotate. The Astro dev server proxies `/auth` and `/api`
to `http://localhost:3001` (the backend dev port from
`Sell-Point-PDSW/.env`).

## Breaking change (please communicate to consumers)

There is no public API change for end users, but for any **internal
frontend tooling** that read the legacy `billflow-session` cookie or
the `localStorage['billflow-session']` blob to extract an
`accessToken` / `refreshToken`:

- The refresh token is no longer in JS-readable storage anywhere. It
  lives only in the HttpOnly cookie. The body of `/auth/login` and
  `/auth/refresh` is `{ accessToken, expiresIn: 900 }` (no
  `refreshToken`).
- The `billflow-session` cookie and the
  `localStorage['billflow-session']` blob are gone. The new
  `AuthIdentityStore` persists identity (`displayName`/`role`/`theme`)
  to `localStorage['billflow-identity']`. There is no
  `localStorage['billflow-session']` anymore.
- The Astro dev server is now the single origin in dev. The
  `PUBLIC_API_URL` env var still works but is no longer the
  recommended way to call the backend from the SPA — the SPA issues
  root-relative `/auth/*` and `/api/*` calls and the dev proxy (or
  production reverse proxy) routes them.

## Same-release-window warning

> **Wire-break risk between PR #1 deploy and PR #2 deploy.** A user
> who logged in before the backend change has no `refreshToken`
> cookie and will lose access at the 15-minute JWT expiry. The
> previous code path also wrote a `refreshToken` to
> `localStorage['billflow-session']` (and the slice-1 backend stopped
> returning `refreshToken` in the body), so on a half-deployed world
> (PR #1 live, PR #2 not yet) the user is silently stuck. **Deploy
> PR #1 and PR #2 in the same release window.** Both PR descriptions
> call this out; this is the documented mitigation in
> `openspec/changes/auth-cookie-refresh/design.md` (no feature flag by
> design). If a half-deploy is unavoidable, the safest rollback is
> to revert the backend first (PR #1), not the frontend.

## Verification (run BEFORE merging)

This is a **frontend** slice. There is no test runner for the
auth-cookie flow in this repo (`strict_tdd: backend true, frontend
false` per the change metadata). The two existing spec files
(`profile-store.spec.ts`, `google-auth.service.spec.ts`) are
unchanged in behavior — `AuthHttpService.fetchWithRefresh(input, init?)`
keeps the same signature and the spies in
`profile-store.spec.ts` still work. The pre-existing
`@types/jasmine`-missing errors in those spec files are unchanged
from `develop` and are out of scope.

1. `npm install` — no new deps; no lockfile changes required.
2. `npx tsc --noEmit` — pass/fail compared to baseline:
   - **Baseline (`develop`)**: 117 pre-existing errors (Jasmine
     types missing in spec files, particles/chart.js types in
     unrelated components, product/category type drift).
   - **This branch**: 111 pre-existing errors (same set, **−6**
     because the slice 2 refactor cleaned up a few stale
     `BillflowSessionData` / `accessToken` / `refreshToken` field
     usages in `ssr-page-data.ts` and `permissions.service.ts`).
   - **No new TypeScript errors introduced.**
3. `npm run build` — Astro build must succeed.
   - Verified on this branch: server entrypoint built in 21.08s,
     complete.
4. `rg "document\.cookie.*refreshToken|localStorage.*refreshToken|localStorage.*accessToken" src/`
   — must return **0 hits**. (Verified on this branch: empty output.)
5. `rg "document\.cookie" src/` — only remaining match is the read
   path in `src/presentation/shared/billflow-session.ts`
   (`readBillflowSessionCookie`, which reads the `billflow-session`
   cookie for identity only — never writes tokens, never reads
   `refreshToken`).
6. **Real HTTP curl smoke against the Astro dev server** (mirrors
   the slice-1 curl pattern but routed through the dev proxy):
   - Start the backend: `cd Sell-Point-PDSW && npm run start:dev`
     (binds `PORT=3001`).
   - Start the frontend: `cd Sell-Point-Frontend && npm run dev`
     (binds `http://localhost:4321`).
   - `curl -c cookies.txt -i -X POST http://localhost:4321/auth/login -H 'content-type: application/json' -d '{"email":"admin@billflow.com","password":"Admin1234!"}'`
     → 200, body `{ accessToken, expiresIn: 900 }` (no `refreshToken`),
     `Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`.
   - `curl -b cookies.txt -i -X POST http://localhost:4321/auth/refresh`
     → 200, new `Set-Cookie` issued (rotation), body
     `{ accessToken, expiresIn: 900 }`.
   - `curl -b cookies.txt -i -X POST http://localhost:4321/auth/refresh` (same old cookie)
     → 401.
   - `curl -b cookies.txt -i -X POST http://localhost:4321/auth/logout`
     → 204, `Set-Cookie: refreshToken=; ...`.
7. **7-step manual smoke** — see section below.

## 7-step manual smoke (T24)

Open Chrome DevTools → Application → Cookies → `http://localhost:4321`.
(Or use the Astro preview build if you want to exercise the
production code path; both go through the same dev proxy in dev.)

1. **Log in** at `/auth` with a valid email + password. The login
   response sets the `refreshToken` cookie. In DevTools, the cookie
   row MUST show `HttpOnly ✓` and `SameSite=Strict`. The
   `Expires / Max-Age` column shows `604800` (7 days) or `2592000`
   (30 days) for `rememberMe: true`.
2. **In the DevTools Console**, run
   `document.cookie` — the printed string MUST NOT include
   `refreshToken`. (`HttpOnly` cookies are invisible to
   `document.cookie`.)
3. **Hard reload** the dashboard (Cmd/Ctrl + Shift + R). The user
   MUST stay logged in. In the Network tab, you should see a
   `POST /auth/refresh` returning `200` shortly before the first
   authenticated GET (the silent refresh), then a `200` for the data
   fetch with the new access token.
4. **Open `/auth/me`** in a new tab — the Network tab should show
   `GET /auth/me` returning `200` with the user profile JSON
   (id/username/role/etc.).
5. **Click Logout**. The Network tab shows `POST /auth/logout`
   returning `204` and a `Set-Cookie: refreshToken=; Expires=...`
   clearing the cookie.
6. **In DevTools**, refresh the Cookies view. The `refreshToken`
   row MUST be gone (or show `Expires` in the past and value empty).
7. **In the Console**, run `document.cookie` again — must still NOT
   include `refreshToken` (the `clearBillflowSessionCookie` writer
   was removed in this PR; the refresh cookie is the only one that
   mattered and it was cleared by the backend, not JS).

If all 7 pass, the slice is good. If 2 or 6 fail, the access token
or refresh token is leaking to JS — **block the merge** and check
the `AuthTokenStore` / `AuthHttpService` refactor.

## Rollback plan

Revert the merge commit (or close this PR without merging). The
frontend changes are localized to:

- 2 new files (`AuthTokenStore`, `AuthIdentityStore`).
- 5 modified files (`auth-http.service.ts`, `session.service.ts`,
  `billflow-session.ts`, `ssr-page-data.ts`, `permissions.service.ts`,
  `auth-page.component.ts`, `dashboard-page.component.ts`).
- 1 modified config (`astro.config.mjs` adds the dev proxy).
- 1 new doc (`docs/deploy/cookie-auth.md`).
- 1 new PR draft (`PR-AUTH-COOKIE-PR2.md` — this file).

Revert the merge restores the old behavior: the access token is
read from `localStorage`, the refresh token is in the body of
`/auth/refresh`, and the `localStorage`/`cookie` writes for
`billflow-session` come back. The backend from PR #1 stays
unchanged, so after revert the SPA is broken until the backend
is also reverted — **rollback order matters**: revert PR #2 first
(frontend), then PR #1 (backend), in that order. The opposite
order breaks login for all users.

## Files changed (high level)

```
 astro.config.mjs                                          |   +18  (T21 dev proxy)
 docs/deploy/cookie-auth.md                                |  +220  (T22 Vercel/Render/Worker)
 src/presentation/features/auth/auth-page.component.ts     |  +12 -2  (T18 login handlers)
 src/presentation/features/dashboard/dashboard-page.component.ts |  +3 -1  (stale comment)
 src/presentation/shared/auth/auth-identity.store.ts       |  new in T14 (+87)
 src/presentation/shared/auth/auth-token.store.ts          |  new in T13 (+40)
 src/presentation/shared/billflow-session.ts               |  +30 -28 (T17 identity-only)
 src/presentation/shared/services/auth-http.service.ts     |  rewrite T15 (+156)
 src/presentation/shared/services/permissions.service.ts   |  +10 -13 (T20 store-based role)
 src/presentation/shared/services/session.service.ts       |  rewrite T16 (+158)
 src/presentation/shared/ssr-page-data.ts                  |  +28 -22 (T19 SSR refresh)
```

Net diff (executable, excluding the new doc and the new stores
which are net additive): roughly +300 / -90.

## Specs & design links

- **Spec**: `Sell-Point-PDSW/openspec/changes/auth-cookie-refresh/specs/auth-secure-cookie-session/spec.md`
- **Design**: `Sell-Point-PDSW/openspec/changes/auth-cookie-refresh/design.md`
- **Tasks**: `Sell-Point-PDSW/openspec/changes/auth-cookie-refresh/tasks.md` (T13–T24)
- **Backend PR #1 doc**: `Sell-Point-PDSW/PR-AUTH-COOKIE-PR1.md`
- **Backend deploy doc**: `Sell-Point-PDSW/docs/deploy/cookie-auth.md`
- **Frontend deploy doc (this PR)**: `docs/deploy/cookie-auth.md`

## Known carry-forwards (NOT introduced by this PR)

These pre-existed on `develop` and are unchanged here. They are
listed because they affect the verify pass:

- `npx tsc --noEmit` reports 111 pre-existing errors on this branch
  (same 117 on develop, −6 from slice 2 cleanup). They are
  concentrated in:
  - `src/presentation/features/profile/profile-store.spec.ts` and
    `src/presentation/shared/services/google-auth.service.spec.ts` —
    missing `@types/jasmine` types. This repo has no test runner
    for spec files; the spec files exist but aren't wired into
    `package.json` scripts.
  - `auth-particles-background.component.ts`,
    `dashboard-particles-background.component.ts`,
    `dashboard-revenue-chart.component.ts` — chart.js / particles
    type mismatches.
  - `product-form-modal.component.ts`,
    `product-remote-datasource.ts`,
    `get-product-movements.use-case.ts`,
    `products-page.component.ts` — product/category type drift.
  - `ssr-page-data.ts` — pre-existing type drift on
    `IssueDate`/`createdAt`/`salePrice` and the `'*'[]` cast in
    `permissions.service.ts`.

None of these block the slice 2 acceptance criteria. They should
be tracked as a separate cleanup PR.

## Backend dev port note

The Astro dev proxy in this PR targets `http://localhost:3001`. The
backend reads `PORT` from `Sell-Point-PDSW/.env` (currently
`PORT=3001`). The spec's example used `3000` (the default in
`configuration.ts`); the actual value is `3001` per
`Sell-Point-PDSW/.env`. If you change the backend port, update
`astro.config.mjs` to match.

## Slice 1 — what was already merged (PR #1)

For completeness, PR #1 delivered:

- `cookie-parser` + `@types/cookie-parser` deps
- `app.use(cookieParser())` wired in `src/main.ts`
- New `cookie.*` config block in `src/config/configuration.ts`
- New `src/infrastructure/services/cookie.service.ts`
  (`setRefreshTokenCookie`, `clearRefreshTokenCookie`,
  `readRefreshTokenCookie`)
- `AuthService.rotateRefreshToken(oldToken)` (Redis-backed rotation)
- `POST /auth/login` sets cookie, returns
  `{ accessToken, expiresIn: 900 }` (no `refreshToken` in body)
- `POST /auth/refresh` reads from cookie, rotates, returns
  `{ accessToken, expiresIn: 900 }`
- New `POST /auth/logout` (`@Public()`, idempotent, returns 204)
- `loginGoogle` matches the new login flow
- Full unit suite green (52 suites / 241 tests)
- New e2e `test/auth-cookie.e2e-spec.ts` (9 tests, all green)
- `docs/deploy/cookie-auth.md` (backend: nginx + Caddy + `cookie.*`
  env-var table + `ALLOWED_ORIGINS` + cross-subdomain warning)
