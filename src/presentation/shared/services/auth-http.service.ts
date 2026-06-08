import { Injectable, inject } from '@angular/core';
import { resolveApiBaseUrl } from './api-base';
import { AuthTokenStore } from '../auth/auth-token.store';
import { AuthIdentityStore } from '../auth/auth-identity.store';

export class AuthError extends Error {
  override name = 'AuthError' as const;
}

export interface AuthMeResponse {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  theme?: string;
  user?: {
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
    email?: string;
    role?: string;
    theme?: string;
  };
}

interface RefreshResponse {
  accessToken: string;
  expiresIn?: number;
}

/**
 * HTTP service for authenticated requests.
 *
 * Reads the access token from {@link AuthTokenStore} (in-memory). On 401,
 * silently calls `POST /auth/refresh` (no body — the refresh token rides
 * in the HttpOnly cookie). On successful refresh, stores the new access
 * token. On refresh failure, clears both stores and redirects to `/auth`.
 */
@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly apiBase = resolveApiBaseUrl();
  private readonly authTokenStore = inject(AuthTokenStore);
  private readonly authIdentityStore = inject(AuthIdentityStore);

  async fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = this.buildHeaders(init?.headers);

    let response = await fetch(input, { ...init, headers, credentials: 'include' });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const retryHeaders = this.buildHeaders(init?.headers);
        response = await fetch(input, { ...init, headers: retryHeaders, credentials: 'include' });
      } else {
        this.clearSessionAndRedirect();
        throw new AuthError('Session expired — redirecting to login');
      }
    }

    return response;
  }

  /**
   * Hits `POST /auth/refresh` with NO body. The refresh token rides in the
   * HttpOnly cookie. On success, stores the new access token. Returns
   * `true` if refresh succeeded, `false` otherwise.
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return false;

      const payload = (await response.json()) as RefreshResponse;
      if (!payload?.accessToken) return false;
      this.authTokenStore.set(payload.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears the in-memory token + identity, then navigates the tab to
   * `/auth`. Does NOT call the backend logout endpoint — the caller should
   * do that first via {@link logout}.
   */
  clearSessionAndRedirect(): void {
    if (typeof window === 'undefined') return;
    this.authTokenStore.clear();
    this.authIdentityStore.clear();
    window.location.href = '/auth';
  }

  /**
   * Calls `POST /auth/logout` (idempotent, clears the refresh cookie) and
   * then clears the in-memory session and navigates to `/auth`. If the
   * request fails, the in-memory session is still cleared locally.
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* ignore — best-effort */
    } finally {
      this.authTokenStore.clear();
      this.authIdentityStore.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  }

  /**
   * Calls `GET /auth/me` and writes the returned profile into
   * {@link AuthIdentityStore}. Returns the parsed response, or `null` if
   * the request failed.
   */
  async fetchAndStoreIdentity(): Promise<AuthMeResponse | null> {
    try {
      const response = await this.fetchWithRefresh(`${this.apiBase}/auth/me`);
      if (!response.ok) return null;
      const profile = (await response.json()) as AuthMeResponse;
      const displayName =
        profile.fullName
        ?? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
        ?? profile.name
        ?? profile.username
        ?? profile.user?.fullName
        ?? profile.user?.name
        ?? profile.user?.username
        ?? profile.email?.split('@')[0];
      const role = profile.role ?? profile.user?.role;
      const theme = profile.theme ?? profile.user?.theme;
      const identity: Record<string, unknown> = { ...profile };
      if (displayName) identity.displayName = displayName;
      if (role) identity.role = role;
      if (theme) identity.theme = theme;
      this.authIdentityStore.set(identity);
      return profile;
    } catch {
      return null;
    }
  }

  private buildHeaders(inputHeaders: HeadersInit | undefined): Headers {
    const headers = new Headers(inputHeaders ?? {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const token = this.authTokenStore.get();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
