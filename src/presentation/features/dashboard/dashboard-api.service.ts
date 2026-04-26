import { Injectable } from '@angular/core';

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
  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);
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

  listProducts(limit = 6): Promise<PaginatedResponse<ProductRowDto>> {
    return this.request<PaginatedResponse<ProductRowDto>>(`/products?page=1&limit=${limit}`);
  }

  listCustomers(limit = 6): Promise<PaginatedResponse<CustomerRowDto>> {
    return this.request<PaginatedResponse<CustomerRowDto>>(`/customers?page=1&limit=${limit}`);
  }
}
