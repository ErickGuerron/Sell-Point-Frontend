import { Injectable, signal } from '@angular/core';

const IDENTITY_STORAGE_KEY = 'billflow-identity';

/**
 * Non-secret identity blob for UI hydration.
 *
 * The refresh token lives only in an HttpOnly cookie. The access token
 * lives only in {@link AuthTokenStore}. The role/display name are not
 * secret, so persisting them to `localStorage` is acceptable and lets the
 * sidebar / user menu render correctly on first paint.
 *
 * The storage key (`billflow-identity`) intentionally overlaps with the
 * pre-change `billflow-session` key's identity fields, but the legacy
 * token fields are no longer written or read.
 */
export interface BillflowIdentityData {
  displayName?: string;
  role?: string;
  theme?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthIdentityStore {
  private readonly _identity = signal<BillflowIdentityData>(this.hydrate());

  /**
   * Replaces the in-memory identity and persists the non-secret fields
   * (displayName/role/theme) to `localStorage` so the next cold start has
   * them available without an extra `/auth/me` round-trip.
   */
  set(identity: BillflowIdentityData): void {
    this._identity.set(identity);
    this.persist(identity);
  }

  /**
   * Returns a frozen snapshot of the current identity. Read-only; mutate via
   * {@link set} or {@link patch}.
   */
  get(): Readonly<BillflowIdentityData> {
    return this._identity();
  }

  /**
   * Merges the provided partial identity into the current one, then
   * re-persists to `localStorage`.
   */
  patch(partial: Partial<BillflowIdentityData>): void {
    const next = { ...this._identity(), ...partial };
    this.set(next);
  }

  /**
   * Clears the in-memory identity and removes the persistence key. Does NOT
   * clear the access token — use {@link AuthTokenStore.clear} for that.
   */
  clear(): void {
    this._identity.set({});
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
    } catch {
      /* ignore — storage may be disabled */
    }
  }

  private hydrate(): BillflowIdentityData {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as BillflowIdentityData;
      // Defensive: strip any legacy token fields that may have been
      // written by older code. Even if the localStorage entry predates
      // this change, we never want a token to be readable from this
      // store.
      if (parsed && typeof parsed === 'object') {
        delete (parsed as Record<string, unknown>).accessToken;
        delete (parsed as Record<string, unknown>).refreshToken;
        delete (parsed as Record<string, unknown>).token;
      }
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private persist(identity: BillflowIdentityData): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    } catch {
      /* ignore — storage may be full or disabled */
    }
  }
}
