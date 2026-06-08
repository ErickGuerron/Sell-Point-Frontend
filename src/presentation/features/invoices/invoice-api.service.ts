import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../shared/services/api-base';
import type { PaginatedList } from '../../shared/types/pagination';

const API_BASE_URL = resolveApiBaseUrl();

export interface InvoiceItemRowDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  productName?: string;
  productCode?: string;
  taxRateId?: string;
  taxPercentage?: number;
  taxAmount?: number;
}

export interface InvoiceRowDto {
  id: string;
  saleId?: string;
  seriesId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  issueDate?: string;
  status?: string;
  customerId?: string;
  customerName?: string;
  customerCedula?: string;
  subtotal: number;
  iva: number;
  total: number;
  saleNumber?: string;
  authorizationNumber?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  pdfUrl?: string;
  items?: InvoiceItemRowDto[];
}

export interface CustomerRowDto {
  id: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cedula?: string;
  address?: string;
  active: boolean;
}

export interface ProductRowDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  unitPrice: number;
  availableQuantity: number;
}

export interface CreateInvoicePayload {
  customerId?: string | null;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceSeriesRowDto {
  id: string;
  branchId: string;
  establishmentCode: string;
  emissionPointCode: string;
  currentSequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceKpisDto {
  totalInvoiced: number;
  issuedCount: number;
  cancelledTotal: number;
  cancelledCount: number;
  last30DaysTotal: number;
  last30DaysCount: number;
}

export interface CreateInvoiceSeriesPayload {
  branchId: string;
  establishmentCode: string;
  emissionPointCode: string;
  currentSequence?: number;
  isActive?: boolean;
}

export type UpdateInvoiceSeriesPayload = Partial<CreateInvoiceSeriesPayload>;

interface BackendCustomer {
  id: string;
  firstName: string;
  lastName?: string;
  cedula: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackendInvoiceItem {
  id: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  taxRateId?: string;
  taxPercentage?: number;
  taxAmount?: number;
  total?: number;
}

interface BackendInvoice {
  id: string;
  saleId?: string;
  seriesId?: string;
  invoiceNumber: string;
  authorizationNumber?: string | null;
  issueDate?: string | Date;
  invoiceDate?: string | Date;
  status?: string;
  cancelledAt?: string | Date | null;
  createdAt?: string | Date;
  subtotal?: number | string;
  iva?: number | string;
  total?: number | string;
  saleNumber?: string;
  customerId?: string;
  customerName?: string;
  customerCedula?: string;
  pdfUrl?: string;
  items?: BackendInvoiceItem[];
}

interface QuickConfirmSaleResponse {
  id: string;
  saleNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  invoice: BackendInvoice;
}

function matchField(value: string | undefined | null, query: string): boolean {
  return (value ?? '').toLowerCase().includes(query);
}

function createIdempotencyKey(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

@Injectable({ providedIn: 'root' })
export class InvoiceApiService {
  private readonly authHttp = inject(AuthHttpService);

  async listInvoices(
    limit = 150,
    startDate?: string,
    endDate?: string,
    status?: string,
    invoiceNumber?: string,
    branchId?: string,
  ): Promise<PaginatedList<InvoiceRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (status) params.set('status', status);
    if (invoiceNumber) params.set('invoiceNumber', invoiceNumber);
    if (branchId) params.set('branchId', branchId);
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoices?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = await response.json() as any;
    const data = (body.data || []).map((item: BackendInvoice) => this.mapBackendInvoice(item));
    return {
      data,
      total: body.total ?? data.length,
      page: body.page ?? 1,
      limit: body.limit ?? limit,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil(data.length / (body.limit ?? limit))),
    };
  }

  async getInvoiceKpis(): Promise<InvoiceKpisDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoices/kpis`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return this.mapInvoiceKpis(await response.json() as Partial<InvoiceKpisDto>);
  }

  async getInvoice(id: string): Promise<InvoiceRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoices/${id}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return this.mapBackendInvoice(await response.json() as BackendInvoice);
  }

  async findInvoiceBySale(saleId: string): Promise<InvoiceRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/sales/${saleId}/invoice`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return this.mapBackendInvoice(await response.json() as BackendInvoice);
  }

  async retryInvoiceForSale(saleId: string): Promise<InvoiceRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/sales/${saleId}/invoice/retry`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return this.mapBackendInvoice(await response.json() as BackendInvoice);
  }

  async resendInvoiceEmail(id: string, email?: string): Promise<{ success: boolean; invoiceId: string; email: string }> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoices/${id}/resend-email`, {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<{ success: boolean; invoiceId: string; email: string }>;
  }

  async cancelInvoice(id: string): Promise<{ success: boolean; invoiceId: string }> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoices/${id}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<{ success: boolean; invoiceId: string }>;
  }

  async fetchInvoicePdf(id: string): Promise<Blob> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoices/${id}/pdf`, {
      headers: { Accept: 'application/pdf' },
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.blob();
  }

  async listInvoiceSeries(params: { page?: number; limit?: number; branchId?: string; isActive?: boolean } = {}): Promise<PaginatedList<InvoiceSeriesRowDto>> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.branchId) query.set('branchId', params.branchId);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoice-series?${query.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as any;
    return {
      data: (body.data || []) as InvoiceSeriesRowDto[],
      total: body.total ?? (body.data || []).length,
      page: body.page ?? 1,
      limit: body.limit ?? (params.limit ?? 20),
      totalPages: body.totalPages ?? Math.max(1, Math.ceil((body.total ?? (body.data || []).length) / (body.limit ?? (params.limit ?? 20)))),
    };
  }

  async createInvoiceSeries(payload: CreateInvoiceSeriesPayload): Promise<InvoiceSeriesRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoice-series`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<InvoiceSeriesRowDto>;
  }

  async updateInvoiceSeries(id: string, payload: UpdateInvoiceSeriesPayload): Promise<InvoiceSeriesRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoice-series/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<InvoiceSeriesRowDto>;
  }

  async activateInvoiceSeries(id: string): Promise<InvoiceSeriesRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoice-series/${id}/activate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<InvoiceSeriesRowDto>;
  }

  async deactivateInvoiceSeries(id: string): Promise<InvoiceSeriesRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/invoice-series/${id}/deactivate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<InvoiceSeriesRowDto>;
  }

  async searchCustomers(q: string, limit = 20): Promise<PaginatedList<CustomerRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as any;
    const data = (body.data || []).map((b: BackendCustomer) => this.mapBackendCustomer(b));
    return {
      data,
      total: body.total ?? data.length,
      page: body.page ?? 1,
      limit: body.limit ?? limit,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil(data.length / (body.limit ?? limit))),
    };
  }

  async fetchCustomersPage(q: string, page: number, limit = 10, filterField = 'all'): Promise<PaginatedList<CustomerRowDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as any;
    const data = this.filterCustomers(
      (body.data || []).map((b: BackendCustomer) => this.mapBackendCustomer(b)),
      q,
      filterField,
    );
    return {
      data,
      total: body.total ?? data.length,
      page: body.page ?? page,
      limit: body.limit ?? limit,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil(data.length / (body.limit ?? limit))),
    };
  }

  async searchProducts(q: string, limit = 20): Promise<PaginatedList<ProductRowDto>> {
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as any;
    const rawItems: any[] = body.data || [];
    const capped = rawItems.slice(0, limit).map((p: any) => this.mapBackendProduct(p));
    const total = body.total ?? capped.length;
    return {
      data: capped,
      total,
      page: 1,
      limit,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil(total / limit)),
    };
  }

  async fetchProductsPage(q: string, page: number, limit = 10, filterField = 'all'): Promise<PaginatedList<ProductRowDto>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json() as any;
    const rawItems: any[] = body.data || [];
    const capped = this.filterProducts(rawItems.slice(0, limit).map((p: any) => this.mapBackendProduct(p)), q, filterField);
    const total = body.total ?? capped.length;
    return {
      data: capped,
      total,
      page: body.page ?? page,
      limit: body.limit ?? limit,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil(total / (body.limit ?? limit))),
    };
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/sales/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': createIdempotencyKey(),
      },
      body: JSON.stringify({
        customerId: payload.customerId || undefined,
        details: payload.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }

    const result = await response.json() as QuickConfirmSaleResponse;
    return this.mapBackendInvoice({
      ...result.invoice,
      saleId: result.invoice.saleId ?? result.id,
      saleNumber: result.saleNumber,
      pdfUrl: result.invoice.pdfUrl,
    });
  }

  async createCustomer(payload: CreateCustomerPayload): Promise<CustomerRowDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    const backend = await response.json() as BackendCustomer;
    return this.mapBackendCustomer(backend);
  }

  invoicePdfUrl(id: string): string {
    return `${API_BASE_URL}/invoices/${id}/pdf`;
  }

  private mapBackendInvoice(invoice: BackendInvoice): InvoiceRowDto {
    const subtotal = Number(invoice.subtotal ?? 0);
    const iva = Number(invoice.iva ?? 0);
    const total = Number(invoice.total ?? subtotal + iva);
    const issueDate = invoice.issueDate ?? invoice.invoiceDate ?? invoice.createdAt ?? new Date().toISOString();
    const invoiceDate = typeof issueDate === 'string' ? issueDate : issueDate.toISOString();

    return {
      id: invoice.id,
      saleId: invoice.saleId,
      seriesId: invoice.seriesId,
      invoiceNumber: invoice.invoiceNumber,
      authorizationNumber: invoice.authorizationNumber,
      invoiceDate,
      issueDate: invoiceDate,
      status: invoice.status,
      cancelledAt: invoice.cancelledAt ? String(invoice.cancelledAt) : null,
      createdAt: invoice.createdAt ? String(invoice.createdAt) : undefined,
      subtotal,
      iva,
      total,
      saleNumber: invoice.saleNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerCedula: invoice.customerCedula,
      pdfUrl: invoice.pdfUrl ?? `/invoices/${invoice.id}/pdf`,
      items: invoice.items?.map((item) => this.mapBackendInvoiceItem(item)),
    };
  }

  private mapBackendInvoiceItem(item: BackendInvoiceItem): InvoiceItemRowDto {
    const subtotal = Number(item.subtotal ?? Number(item.unitPrice) * Number(item.quantity));
    const taxAmount = Number(item.taxAmount ?? 0);
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal,
      taxRateId: item.taxRateId,
      taxPercentage: Number(item.taxPercentage ?? 0),
      taxAmount,
      total: Number(item.total ?? subtotal + taxAmount),
    };
  }

  private mapInvoiceKpis(kpis: Partial<InvoiceKpisDto>): InvoiceKpisDto {
    return {
      totalInvoiced: Number(kpis.totalInvoiced ?? 0),
      issuedCount: Number(kpis.issuedCount ?? 0),
      cancelledTotal: Number(kpis.cancelledTotal ?? 0),
      cancelledCount: Number(kpis.cancelledCount ?? 0),
      last30DaysTotal: Number(kpis.last30DaysTotal ?? 0),
      last30DaysCount: Number(kpis.last30DaysCount ?? 0),
    };
  }

  private mapBackendCustomer(b: BackendCustomer): CustomerRowDto {
    return {
      id: b.id,
      name: b.firstName,
      lastName: b.lastName ?? '',
      cedula: b.cedula,
      email: b.email ?? undefined,
      phone: b.phone ?? undefined,
      address: b.address ?? undefined,
      active: b.isActive === true || b.isActive === 1,
    };
  }

  private mapBackendProduct(p: any): ProductRowDto {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description ?? undefined,
      unitPrice: Number(p.salePrice),
      availableQuantity: Number(p.currentStock),
    };
  }

  private filterCustomers(items: CustomerRowDto[], q: string, field: string): CustomerRowDto[] {
    if (!q.trim()) return items;
    const lower = q.toLowerCase();
    return items.filter((c) => {
      switch (field) {
        case 'name': return matchField(c.name, lower);
        case 'lastName': return matchField(c.lastName, lower);
        case 'cedula': return matchField(c.cedula, lower);
        case 'email': return matchField(c.email, lower);
        default:
          return matchField(c.name, lower)
            || matchField(c.lastName, lower)
            || matchField(c.cedula, lower)
            || matchField(c.email, lower);
      }
    });
  }

  private filterProducts(items: ProductRowDto[], q: string, field: string): ProductRowDto[] {
    if (!q.trim()) return items;
    const lower = q.toLowerCase();
    return items.filter((p) => {
      switch (field) {
        case 'name': return matchField(p.name, lower);
        case 'code': return matchField(p.code, lower);
        case 'description': return matchField(p.description, lower);
        default:
          return matchField(p.name, lower)
            || matchField(p.code, lower)
            || matchField(p.description, lower);
      }
    });
  }
}
