import { Injectable, signal } from '@angular/core';

/**
 * In-memory store for the short-lived access token.
 *
 * Per the auth-cookie-refresh contract (slice 2), the refresh token lives only
 * in an HttpOnly cookie set by the backend. The access token is held in a
 * signal so it is lost on hard reload, which forces a silent `/auth/refresh`
 * on cold tabs and prevents XSS from exfiltrating it from any JS-readable
 * storage.
 *
 * There is deliberately no persistence layer here (no localStorage, no
 * sessionStorage, no cookie write). Use {@link AuthIdentityStore} for
 * non-secret identity that may be hydrated on boot.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  private readonly _accessToken = signal<string | null>(null);

  /**
   * Replaces the in-memory access token. Callers should obtain the token from
   * a `/auth/login` or `/auth/refresh` response.
   */
  set(token: string): void {
    this._accessToken.set(token);
  }

  /**
   * Returns the current access token, or null if the user is not
   * authenticated in this tab.
   */
  get(): string | null {
    return this._accessToken();
  }

  /**
   * Clears the in-memory access token. Does NOT clear the refresh cookie —
   * use {@link AuthHttpService.logout} for that.
   */
  clear(): void {
    this._accessToken.set(null);
  }
}
