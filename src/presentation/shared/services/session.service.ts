import { Injectable, inject, signal } from '@angular/core';
import { UiFeedbackService } from './ui-feedback.service';
import { LocaleService } from './locale.service';
import { AuthHttpService } from './auth-http.service';
import { resolveApiBaseUrl } from './api-base';
import { clearBillflowSessionCookie } from '../billflow-session';
import { getSharedTranslations } from '../i18n/shared.translations';

const API_BASE_URL = resolveApiBaseUrl();

interface BillflowSession {
  id?: string;
  username?: string;
  employeeId?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  user?: { name?: string; firstName?: string; lastName?: string; fullName?: string };
}

interface AuthMeResponse {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
    user?: {
      id?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

interface StoredSession {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly displayName = signal('Usuario');
  readonly userInitials = signal('US');
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  private readonly authHttp = inject(AuthHttpService);
  private hydratePromise: Promise<void> | null = null;

  init(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) return;
      const session = JSON.parse(raw) as BillflowSession;

      this.applyIdentity(session);

      if (!this.hasReadableIdentity(session)) {
        void this.hydrateUserProfile();
      }
    } catch {
      this.displayName.set('Usuario');
      this.userInitials.set('US');
    }
  }

  /**
   * Attempt to restore a session using stored credentials.
   * Priority: localStorage session → refresh token → redirect to /auth
   * Returns true if session was restored and is usable.
   */
  async restoreSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const raw = window.localStorage.getItem('billflow-session');
    if (!raw) return false;

    try {
      const session = JSON.parse(raw) as StoredSession;

      // No refresh token means no session restore possible
      if (!session?.refreshToken) return false;

      // Try to refresh using the stored refresh token
      const refreshed = await this.tryRefresh(session.refreshToken);
      if (refreshed) return true;

      // Refresh failed — clear everything and redirect to auth
      this.clearSession();
      window.location.replace('/auth');
      return false;
    } catch {
      this.clearSession();
      return false;
    }
  }

  private async tryRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;

      const newSession = await response.json() as {
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      };

      const raw = window.localStorage.getItem('billflow-session');
      const current = raw ? JSON.parse(raw) as StoredSession : {};
      const merged: StoredSession = { ...current, ...newSession };

      window.localStorage.setItem('billflow-session', JSON.stringify(merged));

      // Hydrate profile with new token
      void this.hydrateUserProfile();
      return true;
    } catch {
      return false;
    }
  }

  private clearSession(): void {
    try {
      window.localStorage.removeItem('billflow-session');
    } catch { /* ignore */ }
    clearBillflowSessionCookie();
  }

  async hydrateUserProfile(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.hydratePromise) return this.hydratePromise;

    this.hydratePromise = (async () => {
      try {
        const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/auth/me`);
        if (!response.ok) return;

        const profile = await response.json() as AuthMeResponse;
        const raw = window.localStorage.getItem('billflow-session');
        const current = raw ? JSON.parse(raw) as BillflowSession : {};
        const merged: BillflowSession = {
          ...current,
          id: profile.id ?? current.id,
          username: profile.username ?? profile.user?.username ?? current.username,
          email: profile.email ?? current.email,
          role: profile.role ?? current.role,
          firstName: profile.firstName ?? profile.user?.firstName ?? current.firstName,
          lastName: profile.lastName ?? profile.user?.lastName ?? current.lastName,
          fullName: profile.fullName ?? profile.user?.fullName ?? current.fullName,
          user: {
            ...current.user,
            username: profile.username ?? profile.user?.username ?? current.user?.username,
            firstName: profile.firstName ?? profile.user?.firstName ?? current.user?.firstName,
            lastName: profile.lastName ?? profile.user?.lastName ?? current.user?.lastName,
            fullName: profile.fullName ?? profile.user?.fullName ?? current.user?.fullName,
            name: profile.name ?? profile.user?.name ?? current.user?.name,
          },
        };

        window.localStorage.setItem('billflow-session', JSON.stringify(merged));
        this.applyIdentity(merged);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SessionService.hydrateUserProfile]', err);
      } finally {
        this.hydratePromise = null;
      }
    })();

    return this.hydratePromise;
  }

  private hasReadableIdentity(session: BillflowSession): boolean {
    return Boolean(
      session.employeeId
        || session.fullName
        || session.username
        || session.firstName
        || session.lastName
        || session.email
        || session.user?.fullName
        || session.user?.name
        || session.user?.username
        || session.user?.firstName,
    );
  }

  private applyIdentity(session: BillflowSession): void {
    const candidate = session.employeeId
      || session.fullName
      || session.username
      || session.user?.fullName
      || [session.firstName, session.lastName].filter(Boolean).join(' ').trim()
      || session.user?.name
      || session.user?.username
      || session.user?.firstName
      || session.email?.split('@')[0]
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
    if (typeof window === 'undefined') return false;

    try {
      return Boolean(window.localStorage.getItem('billflow-session'));
    } catch {
      return false;
    }
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
