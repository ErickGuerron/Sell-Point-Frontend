import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../../shared/services/api-base';

const API_BASE = resolveApiBaseUrl();

// ─── Internal DTOs (raw backend shapes, no domain mapping) ──────────────────

/** Raw product from the backend — mirrors JSON response before domain mapping. */
interface ProductRawDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean | number;
}

/** Raw stock movement from the backend. */
interface MovementRawDto {
  id: number | string;
  productId: string;
  type: string;
  quantity: number;
  description?: string;
  reason?: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}

/** Raw category from the backend. */
export interface CategoryRawDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

/** Generic paginated response from the backend. */
interface PaginatedRawDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export { type ProductRawDto, type MovementRawDto, type CategoryRawDto, type PaginatedRawDto };

// ─── DataSource ──────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProductRemoteDataSource {
  private readonly authHttp = inject(AuthHttpService);

  // ─── Products ────────────────────────────────────────────────────────────────

  async fetchNextProductCode(signal?: AbortSignal): Promise<string> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/products/next-code`, signal ? { signal } : undefined);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = (await response.json()) as { code: string };
    return body.code;
  }

  async fetchProductById(id: string, signal?: AbortSignal): Promise<ProductRawDto> {
    const response = await this.authHttp.fetchWithRefresh(
      `${API_BASE}/products/${id}`,
      signal ? { signal } : undefined,
    );
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = (await response.json()) as any;
    return this.toProductRaw(body);
  }

  async fetchProductsPage(
    q: string,
    categoryId: string,
    isActive: string,
    page: number,
    limit = 10,
    signal?: AbortSignal,
  ): Promise<PaginatedRawDto<ProductRawDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });

    if (q.trim()) params.set('q', q.trim());
    if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);
    if (isActive && isActive !== 'all') params.set('isActive', isActive === 'active' ? 'true' : 'false');

    const init: RequestInit = {};
    if (signal) init.signal = signal;

    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/products?${params.toString()}`, init);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = (await response.json()) as any;
    const rawItems: ProductRawDto[] = (body.data || []).map((p: any) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description ?? null,
      salePrice: Number(p.salePrice ?? 0),
      costPrice: Number(p.costPrice ?? 0),
      currentStock: Number(p.currentStock ?? p.availableQuantity ?? 0),
      categoryId: p.categoryId,
      categoryName: p.categoryName || '',
      isActive: p.isActive,
    }));

    return {
      data: rawItems,
      total: body.pagination?.total ?? body.total ?? rawItems.length,
      page: body.pagination?.page ?? body.page ?? page,
      limit: body.pagination?.limit ?? body.limit ?? limit,
    };
  }

  async createProduct(payload: {
    code: string;
    name: string;
    description?: string;
    salePrice: number;
    costPrice: number;
    initialStock?: number;
    categoryId: string;
  }): Promise<ProductRawDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.toProductRaw(body);
  }

  async updateProduct(
    id: string,
    payload: {
      name?: string;
      description?: string;
      salePrice?: number;
      costPrice?: number;
      categoryId?: string;
    },
  ): Promise<ProductRawDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.toProductRaw(body);
  }

  async toggleProductActive(id: string, currentActive: boolean): Promise<ProductRawDto> {
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/products/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const body = await response.json();
    return this.toProductRaw(body);
  }

  // ─── Stock Movements ─────────────────────────────────────────────────────────

  async fetchProductMovements(
    productId: string,
    page: number,
    limit = 10,
  ): Promise<PaginatedRawDto<MovementRawDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await this.authHttp.fetchWithRefresh(
      `${API_BASE}/products/${productId}/movements?${params.toString()}`,
    );
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = (await response.json()) as any;
    return {
      data: (body.data || []).map((m: any) => ({
        id: m.id,
        productId: m.productId,
        type: m.type,
        quantity: Number(m.quantity ?? 0),
        description: m.description,
        reason: m.reason,
        previousStock: Number(m.previousStock ?? 0),
        newStock: Number(m.newStock ?? 0),
        createdAt: m.createdAt ?? '',
      })),
      total: body.total ?? (body.data || []).length,
      page: body.page ?? page,
      limit: body.limit ?? limit,
    };
  }

  async adjustStock(
    productId: string,
    payload: {
      type: 'IN' | 'OUT' | 'ADJUST';
      quantity: number;
      description: string;
    },
  ): Promise<MovementRawDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(err.message ?? `Request failed: ${response.status}`);
    }
    const body = (await response.json()) as any;
    return {
      id: body.id,
      productId: body.productId,
      type: body.type,
      quantity: Number(body.quantity ?? 0),
      description: body.description,
      reason: body.reason,
      previousStock: Number(body.previousStock ?? 0),
      newStock: Number(body.newStock ?? 0),
      createdAt: body.createdAt ?? '',
    };
  }

  // ─── Categories ──────────────────────────────────────────────────────────────

  async listCategories(): Promise<CategoryRawDto[]> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/categories?limit=200&isActive=true`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = (await response.json()) as { data: CategoryRawDto[] };
    return body.data;
  }

  // ─── KPIs ──────────────────────────────────────────────────────────────────────

  async getKpis(): Promise<{ totalProducts: number; activeCount: number; lowStockCount: number }> {
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/products/kpis`);
    return (await res.json()) as { totalProducts: number; activeCount: number; lowStockCount: number };
  }

  // ─── Mapper helper ───────────────────────────────────────────────────────────

  /** Normalise a raw `any` backend response into a typed ProductRawDto. */
  private toProductRaw(p: any): ProductRawDto {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description ?? null,
      salePrice: Number(p.salePrice ?? 0),
      costPrice: Number(p.costPrice ?? 0),
      currentStock: Number(p.currentStock ?? p.availableQuantity ?? 0),
      categoryId: p.categoryId,
      categoryName: p.categoryName || '',
      isActive: p.isActive,
    };
  }

}
