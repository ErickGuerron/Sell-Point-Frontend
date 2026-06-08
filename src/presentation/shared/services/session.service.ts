import { Injectable, inject, signal } from '@angular/core';
import { UiFeedbackService } from './ui-feedback.service';
import { LocaleService } from './locale.service';
import { AuthHttpService } from './auth-http.service';
import { AuthTokenStore } from '../auth/auth-token.store';
import { AuthIdentityStore } from '../auth/auth-identity.store';
import { getSharedTranslations } from '../i18n/shared.translations';

interface BillflowIdentity {
  displayName?: string;
  role?: string;
  theme?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly displayName = signal('Usuario');
  readonly userInitials = signal('US');
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  private readonly authHttp = inject(AuthHttpService);
  private readonly authTokenStore = inject(AuthTokenStore);
  private readonly authIdentityStore = inject(AuthIdentityStore);
  private hydratePromise: Promise<void> | null = null;

  init(): void {
    if (typeof window === 'undefined') return;
    const identity = this.authIdentityStore.get();
    if (this.hasReadableIdentity(identity)) {
      this.applyIdentity(identity);
      return;
    }
    void this.hydrateUserProfile();
  }

  /**
   * Attempt to restore a session. Priority:
   *  1. In-memory access token (already in {@link AuthTokenStore}), if its
   *     JWT `exp` claim is still in the future.
   *  2. Silent `/auth/refresh` using the HttpOnly refresh cookie.
   *  3. Failure → clear stores and redirect to `/auth`.
   */
  async restoreSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const existing = this.authTokenStore.get();
    if (existing && this.isAccessTokenValid(existing)) {
      this.applyIdentity(this.authIdentityStore.get());
      return true;
    }

    // Either no token, or the cached one is expired — fall through to refresh.
    if (existing) this.authTokenStore.clear();

    const refreshed = await this.authHttp.refreshAccessToken();
    if (refreshed) {
      this.applyIdentity(this.authIdentityStore.get());
      return true;
    }

    this.authTokenStore.clear();
    this.authIdentityStore.clear();
    window.location.replace('/auth');
    return false;
  }

  /**
   * Defensive JWT `exp` check. The access token is self-contained, so we
   * can decode the payload locally and reject expired tokens before
   * hitting the network. This avoids a wasted 401 round-trip and gives
   * `restoreSession` honest semantics. Fails closed on any parse error.
   */
  private isAccessTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return false;
      const payload = JSON.parse(atob(parts[1])) as { exp?: number };
      if (typeof payload.exp !== 'number') return false;
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private clearSession(): void {
    this.authTokenStore.clear();
    this.authIdentityStore.clear();
  }

  async hydrateUserProfile(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.hydratePromise) return this.hydratePromise;

    this.hydratePromise = (async () => {
      try {
        const profile = await this.authHttp.fetchAndStoreIdentity();
        if (!profile) return;
        const next: BillflowIdentity = {
          ...(this.authIdentityStore.get() as BillflowIdentity),
          ...profile,
        };
        this.authIdentityStore.set(next);
        this.applyIdentity(next);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SessionService.hydrateUserProfile]', err);
      } finally {
        this.hydratePromise = null;
      }
    })();

    return this.hydratePromise;
  }

  private hasReadableIdentity(identity: BillflowIdentity): boolean {
    return Boolean(
      identity.fullName
        || identity.username
        || identity.firstName
        || identity.lastName
        || identity.email
        || identity.displayName
        || (identity.user as { fullName?: string; name?: string; username?: string; firstName?: string } | undefined)?.fullName
        || (identity.user as { fullName?: string; name?: string; username?: string; firstName?: string } | undefined)?.name
        || (identity.user as { fullName?: string; name?: string; username?: string; firstName?: string } | undefined)?.username
        || (identity.user as { fullName?: string; name?: string; username?: string; firstName?: string } | undefined)?.firstName,
    );
  }

  private applyIdentity(identity: BillflowIdentity): void {
    const inner = identity.user as { fullName?: string; name?: string; username?: string; firstName?: string } | undefined;
    const candidate = identity.displayName
      || identity.fullName
      || identity.username
      || [identity.firstName, identity.lastName].filter(Boolean).join(' ').trim()
      || inner?.fullName
      || inner?.name
      || inner?.username
      || inner?.firstName
      || identity.email?.split('@')[0]
      || 'Usuario';

    this.displayName.set(candidate || 'Usuario');
    if (candidate !== 'Usuario') {
      this.userInitials.set(
        candidate
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join(''),
      );
    } else {
      this.userInitials.set('US');
    }
  }

  hasStoredSession(): boolean {
    return Boolean(this.authTokenStore.get());
  }

  async logout(): Promise<void> {
    const { session } = getSharedTranslations(this.localeService.locale());
    const confirmed = await this.feedback.confirm(
      session.logoutTitle,
      session.logoutMessage,
      session.logoutConfirm,
      session.logoutCancel,
    );
    if (!confirmed || typeof window === 'undefined') return;
    this.clearSession();
    window.location.replace('/auth');
  }

  openNotifications(): void {
    const { session } = getSharedTranslations(this.localeService.locale());
    void this.feedback.toast(
      'info',
      session.notificationsTitle,
      session.notificationsMessage,
    );
  }

  async openUserSettings(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.location.replace('/profile');
  }
}
