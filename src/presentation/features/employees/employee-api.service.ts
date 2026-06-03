import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../shared/services/api-base';

const API_BASE_URL = resolveApiBaseUrl();

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

export interface EmployeeKpis {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  blockedEmployees: number;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  cedula?: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
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
    createdFrom?: string;
    createdTo?: string;
  } = {}): Promise<EmployeeListResponse> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.q?.trim()) search.set('q', params.q.trim());
    if (params.role && params.role !== 'all') search.set('role', params.role);
    if (params.status && params.status !== 'all') search.set('status', params.status);
    if (params.createdFrom) search.set('createdFrom', params.createdFrom);
    if (params.createdTo) search.set('createdTo', params.createdTo);

    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/users?${search.toString()}`);
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

  // ─── User KPIs ──────────────────────────────────────────────────────────────

  async getKpis(): Promise<EmployeeKpis> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/users/kpis`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as EmployeeKpis;
  }

  // ─── Register user ─────────────────────────────────────────────────────────

  async registerUser(payload: {
    email: string;
    firstName: string;
    lastName: string;
    cedula: string;
    role: string;
    username: string;
    defaultBranchId: string;
  }): Promise<EmployeeRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) await this.throwApiError(response);
    const body = await response.json();
    return this.mapUser(body);
  }

  // ─── Update user ───────────────────────────────────────────────────────────

  async updateUser(id: string, payload: UpdateUserPayload): Promise<EmployeeRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) await this.throwApiError(response);
    const body = await response.json();
    return this.mapUser(body);
  }

  // ─── Activate / Deactivate ─────────────────────────────────────────────────

  async activateUser(id: string): Promise<EmployeeRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/users/${id}/activate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    return this.mapUser(body);
  }

  async deactivateUser(id: string): Promise<EmployeeRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/users/${id}/deactivate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    return this.mapUser(body);
  }

  // ─── Unlock user (old endpoint, kept for blocked-user management) ──────────

  async unlockUser(id: string): Promise<void> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/auth/unlock/${id}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  }

}
