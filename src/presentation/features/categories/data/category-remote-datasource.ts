import { Injectable } from '@angular/core';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_KEY = 'billflow-session';

// ─── Internal DTOs (raw backend shapes) ──────────────────────────────────────

interface CategoryRawDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean | number;
}

interface PaginatedRawDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export { type CategoryRawDto, type PaginatedRawDto };

// ─── Auth Error ──────────────────────────────────────────────────────────────

export class AuthError extends Error {
  override name = 'AuthError' as const;
}

// ─── DataSource ──────────────────────────────────────────────────────────────

@Injectable()
export class CategoryRemoteDataSource {
  // ── Paginated list ───────────────────────────────────────────────────────────

  async fetchPage(
    q: string,
    page: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<PaginatedRawDto<CategoryRawDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());

    const res = await this.fetchWithAuth(`${API_BASE}/categories?${params.toString()}`, undefined, signal);
    const body = (await res.json()) as any;
    return {
      data: (body.data || []).map((c: any): CategoryRawDto => this.mapRaw(c)),
      total: body.pagination?.total ?? body.total ?? (body.data || []).length,
      page: body.pagination?.page ?? body.page ?? page,
      limit: body.pagination?.limit ?? body.limit ?? limit,
    };
  }

  // ── Flat list (for dropdowns) ────────────────────────────────────────────────

  async listAll(): Promise<CategoryRawDto[]> {
    const res = await this.fetchWithAuth(`${API_BASE}/categories?limit=200`);
    const body = (await res.json()) as { data: CategoryRawDto[] };
    return body.data.map((c) => this.mapRaw(c));
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(payload: { name: string; description?: string }): Promise<CategoryRawDto> {
    const res = await this.fetchWithAuth(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return this.mapRaw(body);
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, payload: { name?: string; description?: string }): Promise<CategoryRawDto> {
    const res = await this.fetchWithAuth(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return this.mapRaw(body);
  }

  // ── Toggle Active ────────────────────────────────────────────────────────────

  async toggleActive(id: string, currentActive: boolean): Promise<CategoryRawDto> {
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const res = await this.fetchWithAuth(`${API_BASE}/categories/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    const body = await res.json();
    return this.mapRaw(body);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private mapRaw(c: any): CategoryRawDto {
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      isActive: c.isActive === true || c.isActive === 1,
    };
  }

  // ── Auth-aware fetch ─────────────────────────────────────────────────────────

  private async fetchWithAuth(
    input: RequestInfo | URL,
    init?: RequestInit,
    signal?: AbortSignal,
  ): Promise<Response> {
    const session = this.getStoredSession();
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (session?.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;

    let response = await fetch(input, { ...init, headers, signal });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newSession = this.getStoredSession();
        if (newSession?.accessToken) {
          headers['Authorization'] = `Bearer ${newSession.accessToken}`;
        }
        response = await fetch(input, { ...init, headers, signal });
      } else {
        throw new AuthError('Session expired — redirecting to login');
      }
    }

    return response;
  }

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
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) return false;
      const newSession = (await res.json()) as {
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
}
