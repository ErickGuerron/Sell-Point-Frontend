import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../shared/services/api-base';

const API_BASE_URL = resolveApiBaseUrl();

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class RoleApiService {
  private readonly authHttp = inject(AuthHttpService);

  // ─── List all roles (for combobox) ─────────────────────────────────────────

  async listRoles(): Promise<RoleDto[]> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/roles`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = (await response.json()) as any;
    // Backend may return a plain array or { data: [...] }
    return Array.isArray(body) ? body : (body.data || []);
  }

  // ─── Get by ID ─────────────────────────────────────────────────────────────

  async getRole(id: string): Promise<RoleDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/roles/${id}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<RoleDto>;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async createRole(payload: CreateRolePayload): Promise<RoleDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/roles`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<RoleDto>;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<RoleDto>;
  }

}
