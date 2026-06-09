import type { AuditLogEntry, AuditAction } from '../domain/audit.entity';

// ─── Backend DTO (snake_case) ────────────────────────────────────────────────

export interface AuditEntryDto {
  id: string;
  table_name?: string;
  tableName?: string;
  record_id?: string;
  recordId?: string;
  action: string;
  changed_by_user_id?: string;
  changedByUserId?: string;
  changed_by_email?: string;
  changedByEmail?: string;
  changed_by_role?: string;
  changedByRole?: string;
  changed_columns?: string[];
  changedColumns?: string[];
  old_values?: Record<string, unknown> | null;
  oldValues?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip_address?: string;
  ipAddress?: string;
  user_agent?: string;
  userAgent?: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  createdAt?: string;
}

export interface AuditListResponseDto {
  data: AuditEntryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditSummaryDto {
  actions_today?: number;
  actionsToday?: number;
  active_users?: number;
  activeUsers?: number;
  top_modified_entity?: string;
  topModifiedEntity?: string;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

function snakeToCamel(val: string | undefined, snake: string | undefined, camel: string | undefined): string | undefined {
  return val ?? snake ?? camel ?? undefined;
}

export function mapAuditEntry(dto: AuditEntryDto): AuditLogEntry {
  return {
    id: dto.id,
    tableName: snakeToCamel(undefined, dto.table_name, dto.tableName) ?? '',
    recordId: snakeToCamel(undefined, dto.record_id, dto.recordId) ?? '',
    action: (snakeToCamel(undefined, dto.action, dto.action) ?? '') as AuditAction,
    changedByUserId: snakeToCamel(undefined, dto.changed_by_user_id, dto.changedByUserId) ?? '',
    changedByEmail: snakeToCamel(undefined, dto.changed_by_email, dto.changedByEmail),
    changedByRole: snakeToCamel(undefined, dto.changed_by_role, dto.changedByRole),
    changedColumns: dto.changed_columns ?? dto.changedColumns ?? undefined,
    oldValues: (dto.old_values ?? dto.oldValues) ?? undefined,
    newValues: (dto.new_values ?? dto.newValues) ?? undefined,
    ipAddress: snakeToCamel(undefined, dto.ip_address, dto.ipAddress),
    userAgent: snakeToCamel(undefined, dto.user_agent, dto.userAgent),
    metadata: dto.metadata ?? undefined,
    createdAt: snakeToCamel(undefined, dto.created_at, dto.createdAt) ?? '',
  };
}

export function mapAuditListResponse(dto: AuditListResponseDto): { data: AuditLogEntry[]; total: number; page: number; limit: number; totalPages: number } {
  return {
    data: (dto.data ?? []).map(mapAuditEntry),
    total: dto.total ?? 0,
    page: dto.page ?? 1,
    limit: dto.limit ?? 50,
    totalPages: dto.totalPages ?? 0,
  };
}

export function mapAuditSummary(dto: AuditSummaryDto): { actionsToday: number; activeUsers: number; topModifiedEntity: string } {
  return {
    actionsToday: dto.actions_today ?? dto.actionsToday ?? 0,
    activeUsers: dto.active_users ?? dto.activeUsers ?? 0,
    topModifiedEntity: dto.top_modified_entity ?? dto.topModifiedEntity ?? '—',
  };
}
