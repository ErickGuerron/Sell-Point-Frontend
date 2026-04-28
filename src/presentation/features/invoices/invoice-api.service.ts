import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export interface InvoiceItemRowDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceRowDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  customerName?: string;
  subtotal: number;
  iva: number;
  total: number;
  items?: InvoiceItemRowDto[];
}

export interface CustomerRowDto {
  id: string;
  name: string;
  lastName: string;
  email?: string;
  phone?: string;
  cedula?: string;
}

export interface ProductRowDto {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class InvoiceApiService {
  async listInvoices(limit = 150): Promise<PaginatedResponse<InvoiceRowDto>> {
    const response = await fetch(`${API_BASE_URL}/invoices?page=1&limit=${limit}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<InvoiceRowDto>>;
  }

  async searchCustomers(q: string, limit = 20): Promise<PaginatedResponse<CustomerRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await fetch(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<CustomerRowDto>>;
  }

  async searchProducts(q: string, limit = 20): Promise<PaginatedResponse<ProductRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<ProductRowDto>>;
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRowDto> {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<InvoiceRowDto>;
  }

  invoicePdfUrl(id: string): string {
    return `${API_BASE_URL}/invoices/${id}/pdf`;
  }
}

