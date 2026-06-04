import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../../shared/services/api-base';
import { ApiRequestError } from '../../employees/employee-api.service';

const API_BASE = resolveApiBaseUrl();
const USE_MOCK = false;

// ─── Internal DTOs ───────────────────────────────────────────────────────────

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

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerKpis {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
}

export { type BackendCustomer, type PaginatedResponse };

// ─── Mock data (migrated from InvoiceApiService) ─────────────────────────────

const MOCK_CUSTOMERS: BackendCustomer[] = [
  { id: 'c001', firstName: 'Juan', lastName: 'Pérez', cedula: '1712345678', email: 'juan@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c002', firstName: 'María', lastName: 'González', cedula: '1723456789', email: 'maria@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c003', firstName: 'Carlos', lastName: 'López', cedula: '1734567890', email: 'carlos@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c004', firstName: 'Ana', lastName: 'Martínez', cedula: '1745678901', email: 'ana@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c005', firstName: 'Pedro', lastName: 'Ramírez', cedula: '1756789012', email: 'pedro@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c006', firstName: 'Laura', lastName: 'Sánchez', cedula: '1767890123', email: 'laura@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c007', firstName: 'Diego', lastName: 'Torres', cedula: '1778901234', email: 'diego@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c008', firstName: 'Sofía', lastName: 'Vargas', cedula: '1789012345', email: 'sofia@example.com', phone: null, address: null, isActive: false, createdAt: '', updatedAt: '' },
  { id: 'c009', firstName: 'Andrés', lastName: 'Mendoza', cedula: '1790123456', email: 'andres@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'c010', firstName: 'Valentina', lastName: 'Rojas', cedula: '1701234567', email: 'valentina@example.com', phone: null, address: null, isActive: true, createdAt: '', updatedAt: '' },
];

// ─── DataSource ──────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CustomerRemoteDataSource {
  private readonly authHttp = inject(AuthHttpService);

  private async throwApiError(response: Response): Promise<never> {
    const text = await response.text().catch(() => '');
    let body: unknown = text;

    try {
      body = text ? JSON.parse(text) : '';
    } catch {
      body = text;
    }

    const message = typeof body === 'object' && body !== null
      ? ((body as { message?: string }).message?.trim() || `Request failed: ${response.status}`)
      : (typeof body === 'string' && body.trim() ? body.trim() : `Request failed: ${response.status}`);

    throw new ApiRequestError(message, response.status, body);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async getKpis(): Promise<CustomerKpis> {
    if (USE_MOCK) {
      const total = MOCK_CUSTOMERS.length;
      const active = MOCK_CUSTOMERS.filter((c) => c.isActive === true || c.isActive === 1).length;
      return { totalCustomers: total, activeCustomers: active, inactiveCustomers: total - active };
    }
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/customers/kpis`);
    return (await res.json()) as CustomerKpis;
  }

  async list(params: { page: number; limit: number; q?: string; cedula?: string; isActive?: 'true' | 'false' | 'all'; createdFrom?: string; createdTo?: string; }): Promise<PaginatedResponse<BackendCustomer>> {
    if (USE_MOCK) {
      // Spec 4 R2: honour the isActive filter on the mock slice too,
      // so dev-mode smoke tests see the same active-only subset.
      const filtered = params.isActive === 'true'
        ? MOCK_CUSTOMERS.filter((c) => c.isActive === true)
        : params.isActive === 'false'
          ? MOCK_CUSTOMERS.filter((c) => c.isActive === false)
          : MOCK_CUSTOMERS;
      const start = (Math.max(1, params.page) - 1) * params.limit;
      const data = filtered.slice(start, start + params.limit);
      return {
        data,
        pagination: {
          total: filtered.length,
          page: Math.max(1, params.page),
          limit: params.limit,
          totalPages: Math.max(1, Math.ceil(filtered.length / params.limit)),
        },
      };
    }
    const searchParams = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });

    if (params.q) searchParams.set('q', params.q);
    if (params.cedula) searchParams.set('cedula', params.cedula);
    // String, not boolean. URLSearchParams.set coerces anyway, but the
    // explicit string-literal union in the param type is what the
    // backend contract requires.
    if (params.isActive && params.isActive !== 'all') searchParams.set('isActive', params.isActive);
    if (params.createdFrom) searchParams.set('createdFrom', params.createdFrom);
    if (params.createdTo) searchParams.set('createdTo', params.createdTo);

    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/customers?${searchParams.toString()}`);
    return await res.json() as PaginatedResponse<BackendCustomer>;
  }

  async create(payload: {
    firstName: string;
    lastName: string;
    cedula: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<BackendCustomer> {
    if (USE_MOCK) {
      const newCustomer: BackendCustomer = {
        id: `c${String(MOCK_CUSTOMERS.length + 1).padStart(3, '0')}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        cedula: payload.cedula,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_CUSTOMERS.push(newCustomer);
      return newCustomer;
    }
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await this.throwApiError(res);
    return res.json() as Promise<BackendCustomer>;
  }

  async update(
    id: string,
    payload: {
      firstName: string;
      lastName: string;
      cedula: string;
      email?: string;
      phone?: string;
      address?: string;
    },
  ): Promise<BackendCustomer> {
    if (USE_MOCK) {
      const idx = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Customer not found');
      MOCK_CUSTOMERS[idx] = {
        ...MOCK_CUSTOMERS[idx],
        firstName: payload.firstName,
        lastName: payload.lastName,
        cedula: payload.cedula,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
      };
      return MOCK_CUSTOMERS[idx];
    }
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await this.throwApiError(res);
    return res.json() as Promise<BackendCustomer>;
  }

  async toggleActive(id: string, currentActive: boolean): Promise<BackendCustomer> {
    if (USE_MOCK) {
      const idx = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Customer not found');
      MOCK_CUSTOMERS[idx] = {
        ...MOCK_CUSTOMERS[idx],
        isActive: !currentActive,
      };
      return MOCK_CUSTOMERS[idx];
    }
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/customers/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    return res.json() as Promise<BackendCustomer>;
  }
}
