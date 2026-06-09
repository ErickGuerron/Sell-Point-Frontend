import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../shared/services/api-base';
import type { AuditLogEntry, AuditFilters } from './domain/audit.entity';
import { mapAuditEntry, mapAuditListResponse, mapAuditSummary } from './data/audit.dto';
import type { AuditEntryDto, AuditListResponseDto, AuditSummaryApiDto } from './data/audit.dto';

const API_BASE_URL = resolveApiBaseUrl();

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly authHttp = inject(AuthHttpService);

  async list(filters: AuditFilters): Promise<{
    data: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const search = new URLSearchParams();
    search.set('page', String(filters.page));
    search.set('limit', String(filters.limit));
    if (filters.tableName?.trim()) search.set('tableName', filters.tableName.trim());
    if (filters.action?.trim()) search.set('action', filters.action.trim());
    if (filters.userId?.trim()) search.set('userId', filters.userId.trim());
    if (filters.recordId?.trim()) search.set('recordId', filters.recordId.trim());
    if (filters.dateFrom) search.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) search.set('dateTo', filters.dateTo);

    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/audit?${search.toString()}`);
    if (!response.ok) throw new Error(`Audit list failed: ${response.status}`);
    const body = (await response.json()) as AuditListResponseDto;
    return mapAuditListResponse(body);
  }

  async getById(id: string): Promise<AuditLogEntry> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/audit/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`Audit getById failed: ${response.status}`);
    const body = (await response.json()) as AuditEntryDto;
    return mapAuditEntry(body);
  }

  async getSummary(): Promise<{ actionsToday: number; activeUsers: number; topModifiedEntity: string }> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/audit/summary`);
    if (!response.ok) throw new Error(`Audit summary failed: ${response.status}`);
    const body = (await response.json()) as AuditSummaryApiDto;
    return mapAuditSummary(body);
  }
}
