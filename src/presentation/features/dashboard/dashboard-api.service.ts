import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../shared/services/api-base';

const API_BASE_URL = resolveApiBaseUrl();

export interface DashboardStatsDto {
  totalClientes: number;
  totalProductos: number;
  totalFacturas: number;
  ventasDelDia: number;
  ventasDelMes: number;
  productosConStockBajo: number;
}

export interface InvoiceRowDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  issueDate?: string;
  createdAt?: string;
  subtotal?: number;
  iva?: number;
  customerName?: string;
  total: number;
}

export interface ProductRowDto {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  price?: number;
  availableQuantity: number;
}

export interface CustomerRowDto {
  id: string;
  // Legacy: backend never emits this; kept for source-compat with old call sites.
  name?: string;
  firstName?: string;
  lastName?: string;
  cedula: string;
  email?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly authHttp = inject(AuthHttpService);

  private async request<T>(path: string): Promise<T> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  getStats(): Promise<DashboardStatsDto> {
    return this.request<DashboardStatsDto>('/dashboard/estadisticas');
  }

  async listInvoices(limit = 6): Promise<PaginatedResponse<InvoiceRowDto>> {
    const res = await this.request<PaginatedResponse<any>>(`/invoices?page=1&limit=${limit}`);
    return {
      ...res,
      data: res.data.map((invoice) => {
        const subtotal = Number(invoice.subtotal ?? 0);
        const iva = Number(invoice.iva ?? 0);
        const total = Number(invoice.total ?? subtotal + iva);
        const rawDate = invoice.issueDate ?? invoice.invoiceDate ?? invoice.createdAt;
        const dateObj = rawDate instanceof Date ? rawDate : (rawDate ? new Date(rawDate) : null);
        const invoiceDate = dateObj && !Number.isNaN(dateObj.getTime())
          ? dateObj.toISOString()
          : (typeof rawDate === 'string' ? rawDate : new Date().toISOString());
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate,
          customerName: invoice.customerName,
          total,
        };
      }),
    };
  }

  async listProducts(limit = 6): Promise<PaginatedResponse<ProductRowDto>> {
    const res = await this.request<PaginatedResponse<any>>(`/products?page=1&limit=${limit}`);
    return {
      ...res,
      data: res.data.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        unitPrice: Number(p.salePrice),
        availableQuantity: Number(p.currentStock),
      })),
    };
  }

  listCustomers(limit = 6, isActive: 'true' | 'false' | 'all' | null = null): Promise<PaginatedResponse<CustomerRowDto>> {
    // Spec 4 R3: thread isActive through the URL as a STRING (not a
    // boolean). The null / 'all' branch preserves the legacy behaviour
    // (no isActive query param) for existing call sites.
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (isActive && isActive !== 'all') params.set('isActive', isActive);
    return this.request<PaginatedResponse<CustomerRowDto>>(`/customers?${params.toString()}`);
  }
}
