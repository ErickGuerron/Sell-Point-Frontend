import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_KEY = 'billflow-session';

export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ProductWithStockDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
}

export interface CreateProductPayload {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  initialStock?: number;
}

export interface UpdateProductPayload {
  categoryId?: string;
  code?: string;
  name?: string;
  description?: string;
  salePrice?: number;
  costPrice?: number;
}

export interface StockMovementDto {
  id: number | string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'SALE';
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private mapBackendProduct(p: any): ProductWithStockDto {
    const stock = Number(p.currentStock ?? p.availableQuantity ?? 0);
    // eslint-disable-next-line no-console
    console.log('[mapBackendProduct]', p.code, 'currentStock raw:', p.currentStock, '→ mapped:', stock);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description ?? undefined,
      salePrice: Number(p.salePrice ?? 0),
      costPrice: Number(p.costPrice ?? 0),
      currentStock: stock,
      categoryId: p.categoryId,
      categoryName: p.categoryName || '',
      isActive: p.isActive === true || p.isActive === 1,
    };
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  async fetchProductsPage(
    q: string,
    categoryId: string,
    isActive: string,
    page: number,
    limit = 10
  ): Promise<PaginatedResponse<ProductWithStockDto>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (q.trim()) {
      params.set('q', q.trim());
    }
    if (categoryId && categoryId !== 'all') {
      params.set('categoryId', categoryId);
    }
    if (isActive && isActive !== 'all') {
      params.set('isActive', isActive === 'active' ? 'true' : 'false');
    }

    const response = await this.fetchWithRefresh(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const body = await response.json() as any;
    return {
      data: (body.data || []).map((p: any) => this.mapBackendProduct(p)),
      total: body.pagination?.total ?? body.total ?? (body.data || []).length,
      page: body.pagination?.page ?? body.page ?? page,
      limit: body.pagination?.limit ?? body.limit ?? limit,
    };
  }

  async createProduct(payload: CreateProductPayload): Promise<ProductWithStockDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapBackendProduct(body);
  }

  async updateProduct(id: string, payload: UpdateProductPayload): Promise<ProductWithStockDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapBackendProduct(body);
  }

  async toggleProductActive(id: string, currentActive: boolean): Promise<ProductWithStockDto> {
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/products/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.mapBackendProduct(body);
  }

  // ─── Stock Movements ───────────────────────────────────────────────────────

  private mapMovement(m: any): StockMovementDto {
    // Backend uses 'description' field and types: IN, OUT, SALE, ADJUSTMENT
    // Normalize ADJUSTMENT → ADJUST for display consistency
    let type: StockMovementDto['type'] = m.type;
    if (m.type === 'ADJUSTMENT') type = 'ADJUST';

    return {
      id: m.id,
      productId: m.productId,
      type,
      quantity: Number(m.quantity ?? 0),
      reason: m.description ?? m.reason ?? '',
      previousStock: Number(m.previousStock ?? 0),
      newStock: Number(m.newStock ?? 0),
      createdAt: m.createdAt ?? '',
    };
  }

  async getProductMovements(
    productId: string,
    page: number,
    limit = 10
  ): Promise<PaginatedResponse<StockMovementDto>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await this.fetchWithRefresh(
      `${API_BASE_URL}/products/${productId}/movements?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const body = await response.json() as any;
    return {
      data: (body.data || []).map((m: any) => this.mapMovement(m)),
      total: body.total ?? (body.data || []).length,
      page: body.page ?? page,
      limit: body.limit ?? limit,
    };
  }

  // ─── Categories ────────────────────────────────────────────────────────────

  async listCategories(): Promise<CategoryDto[]> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/categories?limit=200&isActive=true`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const body = await response.json() as { data: CategoryDto[] };
    return body.data;
  }

  // ─── Fetch & Auth Helpers ──────────────────────────────────────────────────

  private getStoredSession(): { accessToken?: string; refreshToken?: string } | null {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_KEY) : null;
      return raw ? JSON.parse(raw) as { accessToken?: string; refreshToken?: string } : null;
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
      const newSession = await response.json() as { accessToken: string; refreshToken?: string; expiresIn?: number };
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
    const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) ?? {} };
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
