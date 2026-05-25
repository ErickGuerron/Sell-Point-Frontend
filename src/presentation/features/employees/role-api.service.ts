import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_KEY = 'billflow-session';

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class RoleApiService {
  // ─── List all roles (for combobox) ─────────────────────────────────────────

  async listRoles(): Promise<RoleDto[]> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/roles`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = (await response.json()) as any;
    // Backend may return a plain array or { data: [...] }
    return Array.isArray(body) ? body : (body.data || []);
  }

  // ─── Get by ID ─────────────────────────────────────────────────────────────

  async getRole(id: string): Promise<RoleDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/roles/${id}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<RoleDto>;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async createRole(payload: CreateRolePayload): Promise<RoleDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/roles`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<RoleDto>;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<RoleDto>;
  }

  // ─── Fetch & Auth Helpers ──────────────────────────────────────────────────

  private getStoredSession(): { accessToken?: string; refreshToken?: string } | null {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    const session = this.getStoredSession();
    if (!session?.refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!response.ok) return false;
      const newSession = (await response.json()) as { accessToken: string; refreshToken?: string; expiresIn?: number };
      const merged = { ...session, ...newSession };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
      }
      return true;
    } catch {
      return false;
    }
  }

  private async fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const session = this.getStoredSession();
    const headers: Record<string, string> = { ...((init?.headers as Record<string, string>) ?? {}) };
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (session?.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;

    let response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newSession = this.getStoredSession();
        if (newSession?.accessToken) {
          headers['Authorization'] = `Bearer ${newSession.accessToken}`;
        }
        response = await fetch(input, { ...init, headers });
      } else {
        this.clearSessionAndRedirect();
      }
    }

    return response;
  }

  private clearSessionAndRedirect(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    window.location.href = '/auth';
  }
}
