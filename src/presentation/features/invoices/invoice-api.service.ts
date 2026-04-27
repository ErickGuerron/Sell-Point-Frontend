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

  invoicePdfUrl(id: string): string {
    return `${API_BASE_URL}/invoices/${id}/pdf`;
  }
}
