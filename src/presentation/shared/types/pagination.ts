/**
 * Canonical wire shape for paginated list responses.
 *
 * Mirrors the backend's flattened `PaginationInterceptor` output
 * (see `Sell-Point-PDSW/openspec/changes/paginated-response-contract/specs/pagination/spec.md`).
 *
 * Hard contract: `body.pagination === undefined`. The backend does not
 * emit a nested envelope; consumers MUST read top-level fields directly
 * and MUST NOT keep `body?.pagination?.X ?? body?.X` fallback chains.
 */
export interface PaginatedList<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
