// ─── Types ──────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'CANCEL'
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED';

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  changedByUserId: string;
  changedByEmail?: string;
  changedByRole?: string;
  changedColumns?: string[];
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditFilters {
  page: number;
  limit: number;
  tableName?: string;
  action?: string;
  userId?: string;
  recordId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditSummary {
  actionsToday: number;
  activeUsers: number;
  topModifiedEntity: string;
}

export interface AuditListResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
