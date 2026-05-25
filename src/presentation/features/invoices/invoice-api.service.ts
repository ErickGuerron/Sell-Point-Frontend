import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

const AUTH_KEY = 'billflow-session';

export interface InvoiceItemRowDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  productName?: string;
  productCode?: string;
}

export interface InvoiceRowDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  customerName?: string;
  customerCedula?: string;
  subtotal: number;
  iva: number;
  total: number;
  items?: InvoiceItemRowDto[];
}

export interface CustomerRowDto {
  id: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cedula?: string;
  address?: string;
  active: boolean;
}

export interface ProductRowDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  unitPrice: number;
  availableQuantity: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Schema que devuelve el backend (el listado NO incluye lastName) */
interface BackendCustomer {
  id: string;
  firstName: string;
  lastName?: string;
  cedula: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
}


function mockPaginated<T>(all: T[], page: number, limit: number): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);
  return {
    data,
    pagination: { total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) },
  };
}

function matchField(value: string | undefined | null, query: string): boolean {
  return (value ?? '').toLowerCase().includes(query);
}

function filterCustomers(
  items: CustomerRowDto[],
  q: string,
  field: string,
): CustomerRowDto[] {
  if (!q.trim()) return items;
  const lower = q.toLowerCase();
  return items.filter((c) => {
    switch (field) {
      case 'name': return matchField(c.name, lower);
      case 'lastName': return matchField(c.lastName, lower);
      case 'cedula': return matchField(c.cedula, lower);
      case 'email': return matchField(c.email, lower);
      default: // 'all'
        return matchField(c.name, lower)
            || matchField(c.lastName, lower)
            || matchField(c.cedula, lower)
            || matchField(c.email, lower);
    }
  });
}

function filterProducts(
  items: ProductRowDto[],
  q: string,
  field: string,
): ProductRowDto[] {
  if (!q.trim()) return items;
  const lower = q.toLowerCase();
  return items.filter((p) => {
    switch (field) {
      case 'name': return matchField(p.name, lower);
      case 'code': return matchField(p.code, lower);
      case 'description': return matchField(p.description, lower);
      default: // 'all'
        return matchField(p.name, lower)
            || matchField(p.code, lower)
            || matchField(p.description, lower);
    }
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InvoiceApiService {
  async listInvoices(limit = 150): Promise<PaginatedResponse<InvoiceRowDto>> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/invoices?page=1&limit=${limit}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<InvoiceRowDto>>;
  }

  async searchCustomers(q: string, limit = 20): Promise<PaginatedResponse<CustomerRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as PaginatedResponse<any>;
    return { ...body, data: body.data.map((b) => this.mapBackendCustomer(b)) };
  }

  async fetchCustomersPage(q: string, page: number, limit = 10, filterField = 'all'): Promise<PaginatedResponse<CustomerRowDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as PaginatedResponse<any>;
    return { ...body, data: body.data.map((b) => this.mapBackendCustomer(b)) };
  }

  async searchProducts(q: string, limit = 20): Promise<PaginatedResponse<ProductRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as PaginatedResponse<any>;
    return {
      ...body,
      data: body.data.map((p) => this.mapBackendProduct(p)),
    };
  }

  async fetchProductsPage(q: string, page: number, limit = 10, filterField = 'all'): Promise<PaginatedResponse<ProductRowDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as PaginatedResponse<any>;
    return {
      ...body,
      data: body.data.map((p) => this.mapBackendProduct(p)),
    };
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<InvoiceRowDto>;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // ── Auth helpers ──────────────────────────────────────────────────────────────

  private getStoredSession(): { accessToken?: string; refreshToken?: string } | null {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_KEY) : null;
      return raw ? JSON.parse(raw) as { accessToken?: string; refreshToken?: string } : null;
    } catch { return null; }
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
    } catch { return false; }
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
    try { window.localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
    window.location.href = '/auth';
  }

  private mapBackendCustomer(b: BackendCustomer): CustomerRowDto {
    return {
      id: b.id,
      name: b.firstName,
      lastName: b.lastName ?? '',
      cedula: b.cedula,
      email: b.email ?? undefined,
      phone: b.phone ?? undefined,
      address: b.address ?? undefined,
      active: b.isActive === true || b.isActive === 1,
    };
  }

  private mapBackendProduct(p: any): ProductRowDto {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description ?? undefined,
      unitPrice: Number(p.salePrice),
      availableQuantity: Number(p.currentStock),
    };
  }

  // ── Customers ─────────────────────────────────────────────────────────────────

  async createCustomer(payload: CreateCustomerPayload): Promise<CustomerRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const backend = await response.json() as BackendCustomer;
    return this.mapBackendCustomer(backend);
  }

  async listCustomers(): Promise<CustomerRowDto[]> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/customers?limit=200`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as PaginatedResponse<BackendCustomer>;
    return body.data.map((b) => this.mapBackendCustomer(b));
  }

  async updateCustomer(id: string, payload: CreateCustomerPayload): Promise<CustomerRowDto> {
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const backend = await response.json() as BackendCustomer;
    return this.mapBackendCustomer(backend);
  }

  async toggleCustomerActive(id: string, currentActive: boolean): Promise<CustomerRowDto> {
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const response = await this.fetchWithRefresh(`${API_BASE_URL}/customers/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const backend = await response.json() as BackendCustomer;
    return this.mapBackendCustomer(backend);
  }

  invoicePdfUrl(id: string): string {
    if (USE_MOCK) return '#';
    return `${API_BASE_URL}/invoices/${id}/pdf`;
  }
}
