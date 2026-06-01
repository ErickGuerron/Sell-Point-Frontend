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
      data: res.data.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.issueDate ?? invoice.invoiceDate ?? invoice.createdAt,
        customerName: invoice.customerName,
        total: Number(invoice.total ?? 0),
      })),
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
        // TODO(M6-M8-R2a): confirm backend price field — see design §1.2
        // Assumed canonical: `salePrice`. If the Network-tab capture proves
        // otherwise, change this line AND the SSR mapper at
        // `ssr-page-data.ts:188` to use the actual field name.
        unitPrice: Number(p.salePrice),
        availableQuantity: Number(p.currentStock),
      })),
    };
  }

  listCustomers(limit = 6): Promise<PaginatedResponse<CustomerRowDto>> {
    return this.request<PaginatedResponse<CustomerRowDto>>(`/customers?page=1&limit=${limit}`);
  }
}
