import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_KEY = 'billflow-session';

export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private mapCategory(c: any): CategoryDto {
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      isActive: c.isActive === true || c.isActive === 1,
    };
  }

  // ─── Paginated list (for the table) ────────────────────────────────────────

  async fetchCategoriesPage(
    q: string,
    page: number,
    limit = 5
  ): Promise<PaginatedResponse<CategoryDto>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (q.trim()) {
      params.set('q', q.trim());
    }

    const response = await this.fetchWithRefresh(
      `${API_BASE_URL}/categories?${params.toString()}`
    );
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = (await response.json()) as any;
    return {
      data: (body.data || []).map((c: any) => this.mapCategory(c)),
      total: body.pagination?.total ?? body.total ?? (body.data || []).length,
      page: body.pagination?.page ?? body.page ?? page,
      limit: body.pagination?.limit ?? body.limit ?? limit,
    };
  }

  // ─── Flat list (for dropdowns) ─────────────────────────────────────────────

  async listAllCategories(): Promise<CategoryDto[]> {
    const response = await this.fetchWithRefresh(
      `${API_BASE_URL}/categories?limit=200`
    );
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = (await response.json()) as { data: CategoryDto[] };
    return body.data;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async createCategory(
    payload: CreateCategoryPayload
  ): Promise<CategoryDto> {
    const response = await this.fetchWithRefresh(
      `${API_BASE_URL}/categories`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapCategory(body);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateCategory(
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<CategoryDto> {
    const response = await this.fetchWithRefresh(
      `${API_BASE_URL}/categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapCategory(body);
  }

  // ─── Toggle Active ─────────────────────────────────────────────────────────

  async toggleCategoryActive(
    id: string,
    currentActive: boolean
  ): Promise<CategoryDto> {
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const response = await this.fetchWithRefresh(
      `${API_BASE_URL}/categories/${id}/${endpoint}`,
      { method: 'PATCH' }
    );
    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapCategory(body);
  }

  // ─── Fetch & Auth Helpers ──────────────────────────────────────────────────

  private getStoredSession(): {
    accessToken?: string;
    refreshToken?: string;
  } | null {
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(AUTH_KEY)
          : null;
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

  private async fetchWithRefresh(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const session = this.getStoredSession();
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (!headers['Content-Type'])
      headers['Content-Type'] = 'application/json';
    if (session?.accessToken)
      headers['Authorization'] = `Bearer ${session.accessToken}`;

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
