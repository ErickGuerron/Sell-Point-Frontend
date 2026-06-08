import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../../shared/services/api-base';

const API_BASE = resolveApiBaseUrl();

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
  totalPages: number;
}

export { type CategoryRawDto, type PaginatedRawDto };

// ─── DataSource ──────────────────────────────────────────────────────────────

@Injectable()
export class CategoryRemoteDataSource {
  private readonly authHttp = inject(AuthHttpService);

  // ── Paginated list ───────────────────────────────────────────────────────────

  async fetchPage(
    q: string,
    page: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<PaginatedRawDto<CategoryRawDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());

    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories?${params.toString()}`, signal ? { signal } : undefined);
    const body = (await res.json()) as any;
    const data = (body.data || []).map((c: any): CategoryRawDto => this.mapRaw(c));
    return {
      data,
      total: body.total ?? data.length,
      page: body.page ?? page,
      limit: body.limit ?? limit,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil(data.length / (body.limit ?? limit))),
    };
  }

  // ── Flat list (for dropdowns) ────────────────────────────────────────────────

  async listAll(): Promise<CategoryRawDto[]> {
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories?limit=200`);
    const body = (await res.json()) as { data: CategoryRawDto[] };
    return body.data.map((c) => this.mapRaw(c));
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(payload: { name: string; description?: string }): Promise<CategoryRawDto> {
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return this.mapRaw(body);
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, payload: { name?: string; description?: string }): Promise<CategoryRawDto> {
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories/${id}`, {
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
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    const body = await res.json();
    return this.mapRaw(body);
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  async getKpis(): Promise<{ totalCategories: number; activeCount: number }> {
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories/kpis`);
    const body = await res.json();
    return {
      totalCategories: body.totalCategories ?? 0,
      activeCount: body.activeCount ?? 0,
    };
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

}
