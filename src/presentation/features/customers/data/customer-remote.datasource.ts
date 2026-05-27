import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
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

  // ── Public API ──────────────────────────────────────────────────────────────

  async list(): Promise<BackendCustomer[]> {
    if (USE_MOCK) return [...MOCK_CUSTOMERS];
    const res = await this.authHttp.fetchWithRefresh(`${API_BASE}/customers?limit=200`);
    const body = await res.json() as PaginatedResponse<BackendCustomer>;
    return body.data;
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
