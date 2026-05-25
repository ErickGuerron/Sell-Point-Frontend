import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

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

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email: string;
  username: string;
  password: string;
  role: string;
  employeeId: string;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  role?: string;
  isActive?: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('billflow-session') : null;
      if (raw) {
        const session = JSON.parse(raw) as { accessToken?: string };
        if (session.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
    } catch { /* ignore */ }
    return headers;
  }

  /** GET /auth/users — list employees with pagination & filters */
  async listEmployees(params: {
    page?: number;
    limit?: number;
    q?: string;
    employeeId?: string;
    username?: string;
    email?: string;
    role?: string;
    status?: string;
    isActive?: boolean;
  } = {}): Promise<EmployeeListResponse> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.q?.trim()) search.set('q', params.q.trim());
    if (params.employeeId) search.set('employeeId', params.employeeId);
    if (params.username) search.set('username', params.username);
    if (params.email) search.set('email', params.email);
    if (params.role) search.set('role', params.role);
    if (params.status) search.set('status', params.status);
    if (params.isActive !== undefined) search.set('isActive', String(params.isActive));

    const response = await fetch(`${API_BASE_URL}/auth/users?${search.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<EmployeeListResponse>;
  }

  /** POST /auth/unlock/:id — unlock a blocked user */
  async unlockUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/unlock/${id}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  }

  // ── Placeholder for future CRUD endpoints ─────────────────────────────────
  // These will be implemented when the backend exposes the corresponding endpoints

  /** POST /employees — CREATE (placeholder, backend not ready) */
  async createEmployee(_payload: CreateEmployeePayload): Promise<EmployeeRowDto> {
    // When backend is ready, replace with:
    // const response = await this.authFetch(`${API_BASE_URL}/employees`, { method: 'POST', body: JSON.stringify(payload) });
    throw new Error('Employee creation endpoint not available yet. Please integrate when backend is ready.');
  }

  /** PUT /employees/:id — UPDATE (placeholder, backend not ready) */
  async updateEmployee(_id: string, _payload: UpdateEmployeePayload): Promise<EmployeeRowDto> {
    throw new Error('Employee update endpoint not available yet. Please integrate when backend is ready.');
  }

  /** DELETE /employees/:id (placeholder, backend not ready) */
  async deleteEmployee(_id: string): Promise<void> {
    throw new Error('Employee delete endpoint not available yet. Please integrate when backend is ready.');
  }
}
