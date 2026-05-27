import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

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
    return {
      data: (body.data || []).map((c: any): CategoryRawDto => this.mapRaw(c)),
      total: body.pagination?.total ?? body.total ?? (body.data || []).length,
      page: body.pagination?.page ?? body.page ?? page,
      limit: body.pagination?.limit ?? body.limit ?? limit,
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
