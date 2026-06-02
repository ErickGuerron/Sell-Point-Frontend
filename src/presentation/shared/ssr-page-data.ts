import { resolveApiBaseUrl } from './services/api-base';
import type { AppLocale } from './services/locale.service';
import { getSharedTranslations } from './i18n/shared.translations';
import { getBillflowSessionCookieName, parseBillflowSession, serializeBillflowSession } from './billflow-session';
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

const API_BASE_URL = resolveApiBaseUrl();

export interface AstroCookiesLike {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: { path?: string; sameSite?: 'lax' | 'strict' | 'none'; httpOnly?: boolean; secure?: boolean; maxAge?: number }): void;
}

export interface AstroLike {
  cookies: AstroCookiesLike;
}

export interface DashboardInitialData {
  stats: DashboardStatsDto | null;
  invoices: DashboardInvoiceEntry[];
  products: DashboardProductEntry[];
  customers: DashboardCustomerEntry[];
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
}

export interface ProductsInitialData {
  products: ProductEntity[];
  categories: CategoryBackendDto[];
  totalProductsCount: number;
  page: number;
  pageSize: number;
  activeCount: number;
  lowStockCount: number;
}

export interface CategoriesInitialData {
  categories: CategoryEntity[];
  totalCategoriesCount: number;
  activeCategoriesCount: number;
  page: number;
  pageSize: number;
}

export interface InvoicesInitialData {
  invoices: InvoicePageEntry[];
  invoiceKpis: InvoiceKpisDto;
  page: number;
  pageSize: number;
}

export interface InvoicePageEntry extends InvoiceRowDto {
  status: 'issued' | 'cancelled';
  statusLabel: string;
  statusTone: 'issued' | 'cancelled';
  daysOld: number;
}

export interface ProfileInitialData {
  profile: ProfileEntity | null;
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
}

type JsonRequestInit = RequestInit & { headers?: HeadersInit };

async function fetchJsonWithAuth<T>(astro: AstroLike, path: string, init: JsonRequestInit = {}): Promise<T | null> {
  const sessionCookie = astro.cookies.get(getBillflowSessionCookieName())?.value;
  const session = parseBillflowSession(sessionCookie);

  if (!session) return null;

  const buildHeaders = (token?: string): Headers => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  };

  const request = async (token?: string) => fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(token),
  });

  let response = await request(session.accessToken ?? session.token);

  if (response.status === 401 && session.refreshToken) {
    const refreshed = await refreshSession(session.refreshToken);
    if (refreshed) {
      astro.cookies.set(getBillflowSessionCookieName(), serializeBillflowSession(refreshed), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
      });
      response = await request(refreshed.accessToken ?? refreshed.token);
    }
  }

  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

async function refreshSession(refreshToken: string,): Promise<{ accessToken?: string; refreshToken?: string; token?: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    return response.json() as Promise<{ accessToken?: string; refreshToken?: string; token?: string }>;
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
  const daysOld = daysBetween(new Date(invoice.invoiceDate), new Date());
  const status = normalizeInvoiceStatus(invoice.status);
  return {
    ...invoice,
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
  return {
    id: raw.id,
    employeeId: raw.employeeId || '',
    username: raw.username || '',
    email: raw.email || '',
    role: raw.role || '',
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    cedula: raw.cedula ?? raw.documentId ?? raw.document ?? raw.idCard ?? '',
    status: raw.status || (raw.isActive ? 'ACTIVE' : 'INACTIVE'),
    isActive: raw.isActive === true || raw.isActive === 1,
    failedLoginAttempts: raw.failedLoginAttempts ?? 0,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  };
}

export async function loadDashboardInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<DashboardInitialData> {
  const { ssr } = getSharedTranslations(locale);
  const [stats, invoices, products, customers] = await Promise.all([
    fetchJsonWithAuth<DashboardStatsDto>(astro, '/dashboard/estadisticas'),
    fetchJsonWithAuth<{ data: DashboardInvoiceRowDto[] }>(astro, '/invoices?page=1&limit=5'),
    fetchJsonWithAuth<{ data: DashboardProductRowDto[] }>(astro, '/products?page=1&limit=3'),
    fetchJsonWithAuth<{ data: DashboardCustomerRowDto[] }>(astro, '/customers?page=1&limit=4&isActive=true'),
  ]);

  return {
    stats,
    invoices: invoices?.data?.map((invoice) => mapDashboardInvoice(invoice, ssr.unknownCustomer)) ?? [],
    products: products?.data?.map(mapDashboardProduct) ?? [],
    customers: customers?.data?.map((customer) => mapDashboardCustomer(customer, ssr.unknownCustomer)) ?? [],
  };
}

export async function loadCustomersInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<CustomersInitialData> {
  void locale;
  const [customersResponse, kpisResponse] = await Promise.all([
    fetchJsonWithAuth<{ data: BackendCustomer[]; total?: number; page?: number; limit?: number; pagination?: { total: number; totalPages: number; page: number; limit: number } }>(astro, '/customers?page=1&limit=5'),
    fetchJsonWithAuth<{ totalCustomers: number; activeCustomers: number; inactiveCustomers: number }>(astro, '/customers/kpis'),
  ]);
  const data = customersResponse?.data?.map(mapBackendToEntity) ?? [];
  const totalCustomers = customersResponse?.pagination?.total ?? customersResponse?.total ?? data.length;
  const page = customersResponse?.pagination?.page ?? customersResponse?.page ?? 1;
  const pageSize = customersResponse?.pagination?.limit ?? customersResponse?.limit ?? 5;
  const totalPages = customersResponse?.pagination?.totalPages ?? Math.max(1, Math.ceil(totalCustomers / pageSize));

  return {
    customers: data, totalCustomers, totalPages, page, pageSize,
    totalKpi: kpisResponse?.totalCustomers ?? totalCustomers,
    activeKpi: kpisResponse?.activeCustomers ?? 0,
    inactiveKpi: kpisResponse?.inactiveCustomers ?? 0,
  };
}

export async function loadProductsInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<ProductsInitialData> {
  void locale;
  const [productsResponse, categoriesResponse, kpisResponse] = await Promise.all([
    fetchJsonWithAuth<{ data: ProductRawDto[]; total?: number; page?: number; limit?: number; pagination?: { total: number; page: number; limit: number } }>(astro, '/products?page=1&limit=10'),
    fetchJsonWithAuth<{ data: CategoryBackendDto[] }>(astro, '/categories?page=1&limit=20&isActive=true'),
    fetchJsonWithAuth<{ totalProducts: number; activeCount: number; lowStockCount: number }>(astro, '/products/kpis'),
  ]);

  const products = productsResponse?.data?.map(toProductEntity) ?? [];

  return {
    products,
    categories: categoriesResponse?.data ?? [],
    totalProductsCount: productsResponse?.pagination?.total ?? productsResponse?.total ?? products.length,
    page: productsResponse?.pagination?.page ?? productsResponse?.page ?? 1,
    pageSize: productsResponse?.pagination?.limit ?? productsResponse?.limit ?? 5,
    activeCount: kpisResponse?.activeCount ?? 0,
    lowStockCount: kpisResponse?.lowStockCount ?? 0,
  };
}

export async function loadCategoriesInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<CategoriesInitialData> {
  void locale;
  const response = await fetchJsonWithAuth<{ data: CategoryBackendDto[]; total?: number; page?: number; limit?: number; pagination?: { total: number; page: number; limit: number; totalPages: number } }>(astro, '/categories?page=1&limit=5');
  const categories = response?.data?.map(mapCategoryToEntity) ?? [];
  const totalCategoriesCount = response?.pagination?.total ?? response?.total ?? categories.length;
  const page = response?.pagination?.page ?? response?.page ?? 1;
  const pageSize = response?.pagination?.limit ?? response?.limit ?? 5;

  return {
    categories,
    totalCategoriesCount,
    activeCategoriesCount: 0,
    page,
    pageSize,
  };
}

export async function loadInvoicesInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<InvoicesInitialData> {
  const { ssr } = getSharedTranslations(locale);
  const [invoicesResponse, kpis] = await Promise.all([
    fetchJsonWithAuth<{ data: InvoiceRowDto[] }>(astro, '/invoices?page=1&limit=20'),
    fetchJsonWithAuth<InvoiceKpisDto>(astro, '/invoices/kpis'),
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
  };
}

export async function loadProfileInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<ProfileInitialData> {
  void locale;
  const response = await fetchJsonWithAuth<ProfileRawDto>(astro, '/auth/me');
  return {
    profile: response ? toProfileEntity(response) : null,
  };
}

export async function loadEmployeesInitialData(astro: AstroLike, locale: AppLocale = 'es'): Promise<EmployeesInitialData> {
  void locale;
  const [employeesResponse, rolesResponse, kpisResponse] = await Promise.all([
    fetchJsonWithAuth<{ data: any[]; total?: number; page?: number; limit?: number }>(astro, '/users?page=1&limit=5'),
    fetchJsonWithAuth<RoleDto[] | { data: RoleDto[] }>(astro, '/roles'),
    fetchJsonWithAuth<{ totalEmployees: number; activeEmployees: number; inactiveEmployees: number; blockedEmployees: number }>(astro, '/users/kpis'),
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
  };
}
