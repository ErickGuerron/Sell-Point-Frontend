import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_KEY = 'billflow-session';

export interface EmployeeRowDto {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  cedula: string;
  status: string;
  isActive: boolean;
  failedLoginAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResponse {
  data: EmployeeRowDto[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserPayload {
  employeeId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  cedula: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  cedula?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private mapUser(u: any): EmployeeRowDto {
    return {
      id: u.id,
      employeeId: u.employeeId || '',
      username: u.username || '',
      email: u.email || '',
      role: u.role || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      cedula: u.cedula ?? u.documentId ?? u.document ?? u.idCard ?? '',
      status: u.status || (u.isActive ? 'ACTIVE' : 'INACTIVE'),
      isActive: u.isActive === true || u.isActive === 1,
      // failedLoginAttempts may not be returned by the new /users endpoint;
      // default to 0 and rely on the unlock endpoint for blocked-user management.
      failedLoginAttempts: u.failedLoginAttempts ?? 0,
      createdAt: u.createdAt || '',
      updatedAt: u.updatedAt || '',
    };
  }

  // ─── List users ────────────────────────────────────────────────────────────

  async listUsers(params: {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    status?: string;
  } = {}): Promise<EmployeeListResponse> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.q?.trim()) search.set('q', params.q.trim());
    if (params.role && params.role !== 'all') search.set('role', params.role);
    if (params.status && params.status !== 'all') search.set('status', params.status);

    const response = await this.fetchWithRefresh(`${API_BASE_URL}/users?${search.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = (await response.json()) as any;
    // Backend may return a plain array or { data: [...], pagination: {...} }
    const list: any[] = Array.isArray(body) ? body : (body.data || []);
    const total = body.pagination?.total ?? body.total ?? list.length;
    return {
      data: list.map((u) => this.mapUser(u)),
      total,
      page: body.pagination?.page ?? body.page ?? params.page ?? 1,
      limit: body.pagination?.limit ?? body.limit ?? params.limit ?? 10,
    };
  }

  // ─── Create user ───────────────────────────────────────────────────────────

  async createUser(payload: CreateUserPayload): Promise<EmployeeRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapUser(body);
  }

  // ─── Update user ───────────────────────────────────────────────────────────

  async updateUser(id: string, payload: UpdateUserPayload): Promise<EmployeeRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapUser(body);
  }

  // ─── Activate / Deactivate ─────────────────────────────────────────────────

  async activateUser(id: string): Promise<EmployeeRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/users/${id}/activate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    return this.mapUser(body);
  }

  async deactivateUser(id: string): Promise<EmployeeRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/users/${id}/deactivate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    return this.mapUser(body);
  }

  // ─── Unlock user (old endpoint, kept for blocked-user management) ──────────

  async unlockUser(id: string): Promise<void> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/auth/unlock/${id}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
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
      const newSession = (await response.json()) as {
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      };
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
