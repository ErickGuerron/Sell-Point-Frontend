import type { AuditLogEntry, AuditAction } from '../domain/audit.entity';

// ─── Backend DTO (camelCase — actual API shape) ──────────────────────────────

export interface AuditEntryDto {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  userId?: string;
  email?: string;
  rol?: string;
  changedColumns?: string[];
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditListResponseDto {
  data: AuditEntryDto[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditSummaryApiDto {
  actionsPerDay: { date: string; count: number }[];
  activeUsers: { userId: string; email: string; count: number }[];
  topModifiedEntities: { tableName: string; count: number }[];
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

export function mapAuditEntry(dto: AuditEntryDto): AuditLogEntry {
  return {
    id: dto.id,
    tableName: dto.tableName ?? '',
    recordId: dto.recordId ?? '',
    action: (dto.action ?? '') as AuditAction,
    changedByUserId: dto.userId ?? '',
    changedByEmail: dto.email,
    changedByRole: dto.rol,
    changedColumns: dto.changedColumns ?? undefined,
    oldValues: dto.oldValues ?? undefined,
    newValues: dto.newValues ?? undefined,
    ipAddress: dto.ip,
    userAgent: dto.userAgent,
    metadata: dto.metadata ?? undefined,
    createdAt: dto.createdAt ?? '',
  };
}

export function mapAuditListResponse(dto: AuditListResponseDto): {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  return {
    data: (dto.data ?? []).map(mapAuditEntry),
    total: dto.total ?? 0,
    page: dto.page ?? 1,
    limit: dto.limit ?? 25,
    totalPages: dto.total > 0 && dto.limit > 0 ? Math.ceil(dto.total / dto.limit) : 1,
  };
}

export function mapAuditSummary(dto: AuditSummaryApiDto): {
  actionsToday: number;
  activeUsers: number;
  topModifiedEntity: string;
} {
  return {
    actionsToday: dto.actionsPerDay?.reduce((sum, d) => sum + d.count, 0) ?? 0,
    activeUsers: dto.activeUsers?.length ?? 0,
    topModifiedEntity: dto.topModifiedEntities?.[0]?.tableName ?? '—',
  };
}
