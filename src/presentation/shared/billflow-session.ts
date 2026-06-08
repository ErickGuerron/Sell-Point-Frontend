/**
 * Identity-only cookie reader used by SSR frontmatter to check role/admin
 * status before rendering a page.
 *
 * The auth-cookie-refresh contract split the legacy `billflow-session`
 * payload into two halves:
 *
 *  - Auth tokens (access + refresh) — handled by {@link AuthTokenStore}
 *    and the HttpOnly `refreshToken` cookie, never written to or read
 *    from JS.
 *  - Non-secret identity (displayName, role, theme) — this file reads the
 *    legacy `billflow-session` cookie, but only the identity fields are
 *    ever read. There is no longer a writer for this cookie; identity
 *    is persisted to `localStorage` by {@link AuthIdentityStore} instead.
 *
 * The cookie may still be present in pre-deploy sessions and in the SSR
 * layer (where localStorage is unavailable), so the read function is
 * retained. Writers and the clear helper were removed in slice 2.
 */

const SESSION_COOKIE = 'billflow-session';

/**
 * Non-secret identity. The pre-slice-2 `BillflowSessionData` interface
 * included `accessToken` / `refreshToken` / `token` fields; those are
 * intentionally absent here.
 */
export interface BillflowIdentity {
  displayName?: string;
  role?: string;
  theme?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  user?: {
    role?: string;
    fullName?: string;
    name?: string;
    username?: string;
  };
  [key: string]: unknown;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseBillflowSession(value: string | null | undefined): BillflowIdentity | null {
  if (!value) return null;

  const decoded = decodeCookieValue(value);

  try {
    const parsed = JSON.parse(decoded) as BillflowIdentity;
    // Defensive: drop any legacy token fields that may have been
    // written by older code. The shape should already be identity-only,
    // but we never want a token to be readable from this code path.
    if (parsed && typeof parsed === 'object') {
      delete (parsed as Record<string, unknown>).accessToken;
      delete (parsed as Record<string, unknown>).refreshToken;
      delete (parsed as Record<string, unknown>).token;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getBillflowSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function readBillflowSessionCookie(): BillflowIdentity | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) return null;

  return parseBillflowSession(cookie.slice(SESSION_COOKIE.length + 1));
}
