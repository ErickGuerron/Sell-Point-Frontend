import { Injectable } from '@angular/core';
import { resolveApiBaseUrl } from './api-base';
import { clearBillflowSessionCookie, readBillflowSessionCookie, writeBillflowSessionCookie } from '../billflow-session';

const AUTH_KEY = 'billflow-session';

export class AuthError extends Error {
  override name = 'AuthError' as const;
}

interface StoredSession {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly apiBase = resolveApiBaseUrl();

  async fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const session = this.getStoredSession();
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string>) ?? {}),
    };

    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (session?.accessToken || session?.token) {
      headers['Authorization'] = `Bearer ${session.accessToken ?? session.token}`;
    }

    let response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newSession = this.getStoredSession();
        if (newSession?.accessToken || newSession?.token) {
          headers['Authorization'] = `Bearer ${newSession.accessToken ?? newSession.token}`;
        }
        response = await fetch(input, { ...init, headers });
      } else {
        this.clearSessionAndRedirect();
        throw new AuthError('Session expired — redirecting to login');
      }
    }

    return response;
  }

  private getStoredSession(): StoredSession | null {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_KEY) : null;
      return raw ? JSON.parse(raw) as StoredSession : null;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    const session = this.getStoredSession();
    if (!session?.refreshToken) return false;

    try {
      const response = await fetch(`${this.apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!response.ok) return false;

      const newSession = await response.json() as {
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      };

      const merged = { ...session, ...newSession };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
      }
      writeBillflowSessionCookie(merged);
      return true;
    } catch {
      return false;
    }
  }

  private clearSessionAndRedirect(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    clearBillflowSessionCookie();
    window.location.href = '/auth';
  }
}
