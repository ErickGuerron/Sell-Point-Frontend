import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../shared/services/auth-http.service';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

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
  name: string;
  lastName: string;
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

  listInvoices(limit = 6): Promise<PaginatedResponse<InvoiceRowDto>> {
    return this.request<PaginatedResponse<InvoiceRowDto>>(`/invoices?page=1&limit=${limit}`);
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

  listCustomers(limit = 6): Promise<PaginatedResponse<CustomerRowDto>> {
    return this.request<PaginatedResponse<CustomerRowDto>>(`/customers?page=1&limit=${limit}`);
  }
}
