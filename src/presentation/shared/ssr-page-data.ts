import { resolveApiBaseUrl } from './services/api-base';
import type { AppLocale } from './services/locale.service';
import { getSharedTranslations } from './i18n/shared.translations';
import { getBillflowSessionCookieName, parseBillflowSession } from './billflow-session';
import type { PaginatedList } from './types/pagination';
import type { DashboardStatsDto } from '../features/dashboard/dashboard-api.service';
import type { InvoiceRowDto as DashboardInvoiceRowDto, ProductRowDto as DashboardProductRowDto, CustomerRowDto as DashboardCustomerRowDto } from '../features/dashboard/dashboard-api.service';
import type { CustomerEntity } from '../features/customers/domain/customer.entity';
import { mapBackendToEntity } from '../features/customers/data/customer.mapper';
import type { BackendCustomer } from '../features/customers/data/customer-remote.datasource';
import type { ProductEntity } from '../features/products/domain/product.entity';
import { toProductEntity } from '../features/products/data/product.mapper';
import type { ProductRawDto } from '../features/products/data/product-remote-datasource';
import type { CategoryEntity } from '../features/categories/domain/category.entity';
import { mapToEntity as mapCategoryToEntity } from '../features/categories/data/category.mapper';
import type { CategoryRawDto as CategoryBackendDto } from '../features/categories/data/category-remote-datasource';
import type { InvoiceKpisDto, InvoiceRowDto } from '../features/invoices/invoice-api.service';
import type { ProfileEntity } from '../features/profile/domain/profile.entity';
import { toProfileEntity } from '../features/profile/data/profile.mapper';
import type { ProfileRawDto } from '../features/profile/data/profile.dto';
import type { EmployeeRowDto, RoleDto } from '../features/employees/employee-api.service';
import type { AuditLogEntry, AuditSummary } from '../features/audit/domain/audit.entity';
import { mapAuditEntry, mapAuditSummary } from '../features/audit/data/audit.dto';
import type { AuditListResponseDto, AuditSummaryDto } from '../features/audit/data/audit.dto';

// ── Role constants (must match PermissionsService) ─────────────────────────────
const ROLE_ADMIN = 'ADMIN';

/**
 * Returns the user's role from the identity cookie, or undefined if not authenticated.
 * Used in Astro frontmatter to check permissions before rendering a page.
 */
export function getUserRole(astro: AstroLike): string | undefined {
  const sessionCookie = astro.cookies.get(getBillflowSessionCookieName())?.value;
  const session = parseBillflowSession(sessionCookie);
  if (!session) return undefined;
  return session.role ?? session.user?.role;
}

/**
 * Checks if the current user is authenticated and has ADMIN role.
 * Use this to protect admin-only pages at the SSR level.
 */
export function isAdmin(astro: AstroLike): boolean {
  return getUserRole(astro) === ROLE_ADMIN;
}

const API_BASE_URL = resolveApiBaseUrl();

export interface AstroCookiesLike {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: { path?: string; sameSite?: 'lax' | 'strict' | 'none'; httpOnly?: boolean; secure?: boolean; maxAge?: number }): void;
}

export interface AstroLike {
  cookies: AstroCookiesLike;
  request?: { headers?: { get(name: string): string | null } };
}

export interface DashboardInitialData {
  stats: DashboardStatsDto | null;
  invoices: DashboardInvoiceEntry[];
  products: DashboardProductEntry[];
  customers: DashboardCustomerEntry[];
  isAuthenticated?: boolean;
}

export interface DashboardInvoiceEntry {
  id: string;
  number: string;
  customer: string;
  date: string;
  total: number;
}

export interface DashboardProductEntry {
  rank: string;
  code: string;
  name: string;
  units: number;
  price: number;
}

export interface DashboardCustomerEntry {
  id: string;
  name: string;
  cedula: string;
  email?: string;
}

export interface CustomersInitialData {
  customers: CustomerEntity[];
  totalCustomers: number;
  totalPages: number;
  page: number;
  pageSize: number;
  totalKpi: number;
  activeKpi: number;
  inactiveKpi: number;
  isAuthenticated?: boolean;
}

export interface ProductsInitialData {
  products: ProductEntity[];
  categories: CategoryBackendDto[];
  totalProductsCount: number;
  page: number;
  pageSize: number;
  activeCount: number;
  lowStockCount: number;
  isAuthenticated?: boolean;
}

export interface CategoriesInitialData {
  categories: CategoryEntity[];
  totalCategoriesCount: number;
  activeCategoriesCount: number;
  page: number;
  pageSize: number;
  isAuthenticated?: boolean;
}

export interface InvoicesInitialData {
  invoices: InvoicePageEntry[];
  invoiceKpis: InvoiceKpisDto;
  page: number;
  pageSize: number;
  isAuthenticated?: boolean;
}

export interface InvoicePageEntry extends InvoiceRowDto {
  status: 'issued' | 'cancelled';
  statusLabel: string;
  statusTone: 'issued' | 'cancelled';
  daysOld: number;
}

export interface ProfileInitialData {
  profile: ProfileEntity | null;
  isAuthenticated?: boolean;
}

export interface EmployeesInitialData {
  employees: EmployeeRowDto[];
  roles: RoleDto[];
  totalCount: number;
  totalEmployeesKpi: number;
  activeEmployeesKpi: number;
  inactiveEmployeesKpi: number;
  blockedEmployeesKpi: number;
  page: number;
  pageSize: number;
  isAuthenticated?: boolean;
}

type JsonRequestInit = RequestInit & { headers?: HeadersInit };

async function fetchJsonWithAuth<T>(
  astro: AstroLike,
  path: string,
  init: JsonRequestInit = {},
  preFetchedToken?: string | null,
): Promise<T | null> {
  // The legacy `billflow-session` cookie check was removed in slice 2
  // because the cookie is no longer set by the login flow (it carried
  // tokens, which now live in the HttpOnly `refreshToken` cookie + the
  // in-memory `AuthTokenStore`). The `preFetchedToken` parameter is now
  // the sole source of truth for authentication. If it is null/empty,
  // the loader did not obtain a refresh token, and the call falls through
  // to an unauthenticated request (the backend will 401 and `null` is
  // returned below).
  const buildHeaders = (token?: string | null): Headers => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  };

  // Refresh-first: the loader calls `getAccessTokenForRequest(astro)` once
  // before fanning out parallel fetchers, then passes the resulting token
  // in via `preFetchedToken`. If the loader did NOT pre-fetch (e.g. an
  // external caller that still relies on lazy refresh), fall through to
  // the request without a bearer; the backend will 401 and the caller
  // is expected to render an unauthenticated state on `null`.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(preFetchedToken),
  });

  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

/**
 * Refresh-FIRST token resolver for SSR.
 *
 * Per spec (`auth-secure-cookie-session/spec.md` — "Silent Refresh and
 * Failure Recovery"), the app SHALL call `POST /auth/refresh` BEFORE its
 * first authenticated API call. This helper:
 *
 *   1. Inspects the inbound `Cookie` header.
 *   2. If a `refreshToken=` entry is present, forwards it to
 *      `POST /auth/refresh` and returns the new access token.
 *   3. Returns `null` if there is no refresh cookie or the refresh
 *      failed (expired/revoked). Loaders that receive `null` render an
 *      unauthenticated state; the client-side `restoreSession` will
 *      perform the actual redirect to `/auth` after hydration.
 *
 * Callers MUST invoke this exactly once per page load and pass the
 * result into every `fetchJsonWithAuth` call as `preFetchedToken` to
 * avoid N parallel refreshes from a single page (e.g. dashboard fans
 * out 4 parallel calls).
 */
export async function getAccessTokenForRequest(astro: AstroLike): Promise<string | null> {
  const inboundCookie = astro.request?.headers?.get('cookie') ?? astro.request?.headers?.get('Cookie');
  if (!inboundCookie) return null;
  if (!/(?:^|;\s*)refreshToken=/.test(inboundCookie)) return null;

  const refreshed = await refreshSession(astro);
  return refreshed?.accessToken ?? null;
}

/**
 * Forwards the inbound `Cookie` header to the backend `/auth/refresh`
 * endpoint (no body). The backend reads the `refreshToken` from the
 * forwarded cookie, rotates, and returns a new access token. The
 * `Set-Cookie` from the backend is propagated to the browser by the
 * Astro dev proxy (Vite `server.proxy`) or by the prod reverse proxy.
 */
async function refreshSession(astro: AstroLike): Promise<{ accessToken: string } | null> {
  const inboundCookie = astro.request?.headers?.get('cookie') ?? astro.request?.headers?.get('Cookie');
  if (!inboundCookie) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: inboundCookie,
      },
    });

    if (!response.ok) return null;

    // Propagate the rotated cookie back to the browser's cookie jar via Astro
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/refreshToken=([^;]+)/);
      if (match) {
        const tokenValue = match[1];
        const maxAgeMatch = setCookie.match(/Max-Age=([^;]+)/i);
        const pathMatch = setCookie.match(/Path=([^;]+)/i);
        const sameSiteMatch = setCookie.match(/SameSite=([^;]+)/i);
        const httpOnly = /HttpOnly/i.test(setCookie);
        const secure = /Secure/i.test(setCookie);

        const options: any = {
          httpOnly,
          secure,
          path: pathMatch ? pathMatch[1] : '/',
        };
        if (maxAgeMatch) {
          options.maxAge = parseInt(maxAgeMatch[1], 10);
        }
        if (sameSiteMatch) {
          options.sameSite = sameSiteMatch[1].toLowerCase() as 'lax' | 'strict' | 'none';
        }

        astro.cookies.set('refreshToken', tokenValue, options);
      }
    }

    return response.json() as Promise<{ accessToken: string }>;
  } catch {
    return null;
  }
}

function mapDashboardInvoice(invoice: DashboardInvoiceRowDto, unknownCustomerLabel: string): DashboardInvoiceEntry {
  return {
    id: invoice.id,
    number: invoice.invoiceNumber,
    customer: invoice.customerName || unknownCustomerLabel,
    date: invoice.invoiceDate ?? invoice.issueDate ?? invoice.createdAt ?? '',
    total: Number(invoice.total ?? 0),
  };
}

function mapDashboardProduct(product: DashboardProductRowDto): DashboardProductEntry {
  // R2a fix — SSR reads the raw backend field directly. The CSR layer
  // translates `p.salePrice` to `unitPrice` at dashboard-api.service.ts:87
  // and then `mapProduct` reads `unitPrice ?? price`. The SSR path skips
  // that translation, so it must read the raw field name. If the canonical
  // backend field changes (see docs/milestones/M6-M8/products-endpoint-shape.md),
  // update BOTH this line and the CSR line.
  const rawPrice = product.salePrice;
  return {
    rank: '00',
    code: product.code,
    name: product.name,
    units: Number(product.availableQuantity ?? 0),
    price: Number(rawPrice),
  };
}

function mapDashboardCustomer(customer: DashboardCustomerRowDto, unknownCustomerLabel: string): DashboardCustomerEntry {
  const fullName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  return {
    id: customer.id,
    name: fullName || unknownCustomerLabel,
    cedula: customer.cedula,
    email: customer.email ?? undefined,
  };
}

function mapInvoiceEntry(invoice: InvoiceRowDto, copy: { invoiceIssuedLabel: string; invoiceCancelledLabel: string }): InvoicePageEntry {
  // The SSR path reads the raw backend response which has `issueDate`, not `invoiceDate`.
  // Normalise it the same way the CSR mapper (mapBackendInvoice) does.
  const rawIssueDate = (invoice as Record<string, unknown>).issueDate ?? invoice.invoiceDate ?? (invoice as Record<string, unknown>).createdAt;
  const invoiceDate = rawIssueDate ? String(rawIssueDate) : new Date().toISOString();
  const daysOld = daysBetween(new Date(invoiceDate), new Date());
  const status = normalizeInvoiceStatus(invoice.status);
  return {
    ...invoice,
    invoiceDate,
    status,
    daysOld,
    statusLabel: status === 'cancelled' ? copy.invoiceCancelledLabel : copy.invoiceIssuedLabel,
    statusTone: status,
  };
}

function normalizeInvoiceStatus(status?: string): 'issued' | 'cancelled' {
  return status?.toUpperCase() === 'CANCELLED' ? 'cancelled' : 'issued';
}

function daysBetween(start: Date, end: Date): number {
  const a = new Date(start);
  const b = new Date(end);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

function mapEmployee(raw: any): EmployeeRowDto {
  const status = typeof raw.status === 'string' && raw.status.trim()
    ? raw.status.trim()
    : (raw.isActive ? 'ACTIVE' : 'INACTIVE');
  return {
    id: raw.id,
    employeeId: raw.employeeId || '',
    username: raw.username || '',
    email: raw.email || '',
    role: raw.role || '',
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    cedula: raw.cedula ?? raw.documentId ?? raw.document ?? raw.idCard ?? '',
    status,
    isActive: raw.isActive === true || raw.isActive === 1,
    failedLoginAttempts: raw.failedLoginAttempts ?? 0,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  };
}

export async function loadDashboardInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<DashboardInitialData> {
  const { ssr } = getSharedTranslations(locale);
  const token = await getAccessTokenForRequest(astro);
  const [stats, invoices, products, customers] = await Promise.all([
    fetchJsonWithAuth<DashboardStatsDto>(astro, '/dashboard/estadisticas', {}, token),
    fetchJsonWithAuth<{ data: DashboardInvoiceRowDto[] }>(astro, '/invoices?page=1&limit=5', {}, token),
    fetchJsonWithAuth<{ data: DashboardProductRowDto[] }>(astro, '/products?page=1&limit=3', {}, token),
    fetchJsonWithAuth<{ data: DashboardCustomerRowDto[] }>(astro, '/customers?page=1&limit=4', {}, token),
  ]);

  return {
    stats,
    invoices: invoices?.data?.map((invoice) => mapDashboardInvoice(invoice, ssr.unknownCustomer)) ?? [],
    products: products?.data?.map(mapDashboardProduct) ?? [],
    customers: customers?.data?.map((customer) => mapDashboardCustomer(customer, ssr.unknownCustomer)) ?? [],
    isAuthenticated: !!token,
  };
}

export async function loadCustomersInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<CustomersInitialData> {
  void locale;
  const token = await getAccessTokenForRequest(astro);
  const [customersResponse, kpisResponse] = await Promise.all([
    fetchJsonWithAuth<PaginatedList<BackendCustomer>>(astro, '/customers?page=1&limit=5', {}, token),
    fetchJsonWithAuth<{ totalCustomers: number; activeCustomers: number; inactiveCustomers: number }>(astro, '/customers/kpis', {}, token),
  ]);
  const data = customersResponse?.data?.map(mapBackendToEntity) ?? [];
  const totalCustomers = customersResponse?.total ?? data.length;
  const page = customersResponse?.page ?? 1;
  const pageSize = customersResponse?.limit ?? 5;
  const totalPages = customersResponse?.totalPages ?? 0;

  return {
    customers: data, totalCustomers, totalPages, page, pageSize,
    totalKpi: kpisResponse?.totalCustomers ?? totalCustomers,
    activeKpi: kpisResponse?.activeCustomers ?? 0,
    inactiveKpi: kpisResponse?.inactiveCustomers ?? 0,
    isAuthenticated: !!token,
  };
}

export async function loadProductsInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<ProductsInitialData> {
  void locale;
  const token = await getAccessTokenForRequest(astro);
  const [productsResponse, categoriesResponse, kpisResponse] = await Promise.all([
    fetchJsonWithAuth<PaginatedList<ProductRawDto>>(astro, '/products?page=1&limit=10', {}, token),
    fetchJsonWithAuth<{ data: CategoryBackendDto[] }>(astro, '/categories?page=1&limit=20&isActive=true', {}, token),
    fetchJsonWithAuth<{ totalProducts: number; activeCount: number; lowStockCount: number }>(astro, '/products/kpis', {}, token),
  ]);

  const products = productsResponse?.data?.map(toProductEntity) ?? [];

  return {
    products,
    categories: categoriesResponse?.data ?? [],
    totalProductsCount: productsResponse?.total ?? products.length,
    page: productsResponse?.page ?? 1,
    pageSize: productsResponse?.limit ?? 5,
    activeCount: kpisResponse?.activeCount ?? 0,
    lowStockCount: kpisResponse?.lowStockCount ?? 0,
    isAuthenticated: !!token,
  };
}

export async function loadCategoriesInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<CategoriesInitialData> {
  void locale;
  const token = await getAccessTokenForRequest(astro);
  const [categoriesResponse, kpis] = await Promise.all([
    fetchJsonWithAuth<PaginatedList<CategoryBackendDto>>(astro, '/categories?page=1&limit=5', {}, token),
    fetchJsonWithAuth<{ totalCategories: number; activeCount: number }>(astro, '/categories/kpis', {}, token),
  ]);
  const categories = categoriesResponse?.data?.map(mapCategoryToEntity) ?? [];
  const totalCategoriesCount = categoriesResponse?.total ?? categories.length;

  return {
    categories,
    totalCategoriesCount: kpis?.totalCategories ?? totalCategoriesCount,
    activeCategoriesCount: kpis?.activeCount ?? totalCategoriesCount,
    page: categoriesResponse?.page ?? 1,
    pageSize: categoriesResponse?.limit ?? 5,
    isAuthenticated: !!token,
  };
}

export async function loadInvoicesInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<InvoicesInitialData> {
  const { ssr } = getSharedTranslations(locale);
  const token = await getAccessTokenForRequest(astro);
  const [invoicesResponse, kpis] = await Promise.all([
    fetchJsonWithAuth<{ data: InvoiceRowDto[] }>(astro, '/invoices?page=1&limit=20', {}, token),
    fetchJsonWithAuth<InvoiceKpisDto>(astro, '/invoices/kpis', {}, token),
  ]);

  return {
    invoices: invoicesResponse?.data?.map((invoice) => mapInvoiceEntry(invoice, ssr)) ?? [],
    invoiceKpis: kpis ?? {
      totalInvoiced: 0,
      issuedCount: 0,
      cancelledTotal: 0,
      cancelledCount: 0,
      last30DaysTotal: 0,
      last30DaysCount: 0,
    },
    page: 1,
    pageSize: 5,
    isAuthenticated: !!token,
  };
}

export async function loadProfileInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<ProfileInitialData> {
  void locale;
  const token = await getAccessTokenForRequest(astro);
  const response = await fetchJsonWithAuth<ProfileRawDto>(astro, '/auth/me', {}, token);
  return {
    profile: response ? toProfileEntity(response) : null,
    isAuthenticated: !!token,
  };
}

export async function loadEmployeesInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<EmployeesInitialData> {
  void locale;
  const token = await getAccessTokenForRequest(astro);
  const [employeesResponse, rolesResponse, kpisResponse] = await Promise.all([
    fetchJsonWithAuth<PaginatedList<EmployeeRowDto>>(astro, '/users?page=1&limit=5', {}, token),
    fetchJsonWithAuth<RoleDto[] | { data: RoleDto[] }>(astro, '/roles', {}, token),
    fetchJsonWithAuth<{ totalEmployees: number; activeEmployees: number; inactiveEmployees: number; blockedEmployees: number }>(astro, '/users/kpis', {}, token),
  ]);

  const employees = employeesResponse?.data?.map(mapEmployee) ?? [];
  const totalCount = employeesResponse?.total ?? employees.length;
  const page = employeesResponse?.page ?? 1;
  const pageSize = employeesResponse?.limit ?? 5;
  const roles = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.data ?? []);

  return {
    employees,
    roles,
    totalCount,
    totalEmployeesKpi: kpisResponse?.totalEmployees ?? totalCount,
    activeEmployeesKpi: kpisResponse?.activeEmployees ?? 0,
    inactiveEmployeesKpi: kpisResponse?.inactiveEmployees ?? 0,
    blockedEmployeesKpi: kpisResponse?.blockedEmployees ?? 0,
    page,
    pageSize,
    isAuthenticated: !!token,
  };
}

export interface AuditInitialData {
  entries: AuditLogEntry[];
  summary: AuditSummary;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function loadAuditInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<AuditInitialData> {
  void locale;
  const [entriesResponse, summaryResponse] = await Promise.all([
    fetchJsonWithAuth<AuditListResponseDto>(astro, '/audit?page=1&limit=5'),
    fetchJsonWithAuth<AuditSummaryDto>(astro, '/audit/summary'),
  ]);

  const mapped = entriesResponse ? mapAuditListResponse(entriesResponse) : { data: [], total: 0, page: 1, limit: 5, totalPages: 0 };

  return {
    entries: mapped.data,
    summary: summaryResponse ? mapAuditSummary(summaryResponse) : { actionsToday: 0, activeUsers: 0, topModifiedEntity: '—' },
    total: mapped.total,
    page: mapped.page,
    pageSize: mapped.limit,
    totalPages: mapped.totalPages,
  };
}
