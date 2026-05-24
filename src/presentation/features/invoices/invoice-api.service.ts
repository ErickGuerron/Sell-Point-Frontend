import { Injectable } from '@angular/core';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
const USE_MOCK = true; // ← backend sin implementar todavía

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
  description?: string;
  unitPrice: number;
  availableQuantity: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email?: string;
  phone?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CUSTOMERS: CustomerRowDto[] = [
  { id: 'c001', name: 'Juan', lastName: 'Pérez', email: 'juan@example.com', cedula: '1712345678' },
  { id: 'c002', name: 'María', lastName: 'González', email: 'maria@example.com', cedula: '1723456789' },
  { id: 'c003', name: 'Carlos', lastName: 'López', email: 'carlos@example.com', cedula: '1734567890' },
  { id: 'c004', name: 'Ana', lastName: 'Martínez', email: 'ana@example.com', cedula: '1745678901' },
  { id: 'c005', name: 'Pedro', lastName: 'Ramírez', email: 'pedro@example.com', cedula: '1756789012' },
  { id: 'c006', name: 'Laura', lastName: 'Sánchez', email: 'laura@example.com', cedula: '1767890123' },
  { id: 'c007', name: 'Diego', lastName: 'Torres', email: 'diego@example.com', cedula: '1778901234' },
  { id: 'c008', name: 'Sofía', lastName: 'Vargas', email: 'sofia@example.com', cedula: '1789012345' },
  { id: 'c009', name: 'Andrés', lastName: 'Mendoza', email: 'andres@example.com', cedula: '1790123456' },
  { id: 'c010', name: 'Valentina', lastName: 'Rojas', email: 'valentina@example.com', cedula: '1701234567' },
];

const MOCK_PRODUCTS: ProductRowDto[] = [
  { id: 'p001', code: 'PRO-001', name: 'Coca Cola 355ml', unitPrice: 1.50, availableQuantity: 200, description: 'Bebida gaseosa 355ml' },
  { id: 'p002', code: 'PRO-002', name: 'Papas Lays 120g', unitPrice: 2.00, availableQuantity: 150, description: 'Papas fritas 120g' },
  { id: 'p003', code: 'PRO-003', name: 'Pan Bimbo 500g', unitPrice: 3.50, availableQuantity: 80, description: 'Pan de molde 500g' },
  { id: 'p004', code: 'PRO-004', name: 'Arroz Superior 1kg', unitPrice: 2.80, availableQuantity: 120, description: 'Arroz premium 1kg' },
  { id: 'p005', code: 'PRO-005', name: 'Aceite Girasol 1L', unitPrice: 4.20, availableQuantity: 60, description: 'Aceite vegetal 1 litro' },
  { id: 'p006', code: 'PRO-006', name: 'Leche Entera 1L', unitPrice: 1.80, availableQuantity: 90, description: 'Leche entera pasteurizada' },
  { id: 'p007', code: 'PRO-007', name: 'Fideos Tallarines 500g', unitPrice: 1.60, availableQuantity: 140, description: 'Fideos secos 500g' },
  { id: 'p008', code: 'PRO-008', name: 'Atún Enlatado 170g', unitPrice: 2.50, availableQuantity: 100, description: 'Atún sólido en aceite' },
  { id: 'p009', code: 'PRO-009', name: 'Mayonesa Hellmanns 500g', unitPrice: 3.90, availableQuantity: 50, description: 'Mayonesa clásica' },
  { id: 'p010', code: 'PRO-010', name: 'Galletas Oreo 120g', unitPrice: 1.75, availableQuantity: 200, description: 'Galletas rellenas de crema' },
  { id: 'p011', code: 'PRO-011', name: 'Azúcar Morena 1kg', unitPrice: 2.20, availableQuantity: 70, description: 'Azúcar morena granulada' },
  { id: 'p012', code: 'PRO-012', name: 'Café Instantáneo 100g', unitPrice: 5.00, availableQuantity: 40, description: 'Café liofilizado' },
];

const MOCK_INVOICES: InvoiceRowDto[] = [
  { id: 'inv-001', invoiceNumber: 'FAC-001', invoiceDate: '2026-05-20T10:30:00Z', customerId: 'c001', customerName: 'Juan Pérez', subtotal: 28.40, iva: 4.26, total: 32.66 },
  { id: 'inv-002', invoiceNumber: 'FAC-002', invoiceDate: '2026-05-19T14:15:00Z', customerId: 'c002', customerName: 'María González', subtotal: 55.00, iva: 8.25, total: 63.25 },
  { id: 'inv-003', invoiceNumber: 'FAC-003', invoiceDate: '2026-05-18T09:45:00Z', customerId: 'c003', customerName: 'Carlos López', subtotal: 12.50, iva: 1.88, total: 14.38 },
  { id: 'inv-004', invoiceNumber: 'FAC-004', invoiceDate: '2026-05-17T16:00:00Z', customerId: 'c005', customerName: 'Pedro Ramírez', subtotal: 89.20, iva: 13.38, total: 102.58 },
  { id: 'inv-005', invoiceNumber: 'FAC-005', invoiceDate: '2026-05-15T11:20:00Z', customerId: 'c004', customerName: 'Ana Martínez', subtotal: 33.00, iva: 4.95, total: 37.95 },
  { id: 'inv-006', invoiceNumber: 'FAC-006', invoiceDate: '2026-05-22T08:00:00Z', customerId: 'c006', customerName: 'Laura Sánchez', subtotal: 15.00, iva: 2.25, total: 17.25 },
  { id: 'inv-007', invoiceNumber: 'FAC-007', invoiceDate: '2026-05-21T13:30:00Z', customerId: 'c007', customerName: 'Diego Torres', subtotal: 42.80, iva: 6.42, total: 49.22 },
  { id: 'inv-008', invoiceNumber: 'FAC-008', invoiceDate: '2026-05-10T10:00:00Z', customerId: 'c008', customerName: 'Sofía Vargas', subtotal: 67.50, iva: 10.13, total: 77.63 },
];

let invoiceCounter = MOCK_INVOICES.length;

function mockPaginated<T>(all: T[], page: number, limit: number): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);
  return {
    data,
    pagination: { total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) },
  };
}

function matchField(value: string | undefined | null, query: string): boolean {
  return (value ?? '').toLowerCase().includes(query);
}

function filterCustomers(
  items: CustomerRowDto[],
  q: string,
  field: string,
): CustomerRowDto[] {
  if (!q.trim()) return items;
  const lower = q.toLowerCase();
  return items.filter((c) => {
    switch (field) {
      case 'name': return matchField(c.name, lower);
      case 'lastName': return matchField(c.lastName, lower);
      case 'cedula': return matchField(c.cedula, lower);
      case 'email': return matchField(c.email, lower);
      default: // 'all'
        return matchField(c.name, lower)
            || matchField(c.lastName, lower)
            || matchField(c.cedula, lower)
            || matchField(c.email, lower);
    }
  });
}

function filterProducts(
  items: ProductRowDto[],
  q: string,
  field: string,
): ProductRowDto[] {
  if (!q.trim()) return items;
  const lower = q.toLowerCase();
  return items.filter((p) => {
    switch (field) {
      case 'name': return matchField(p.name, lower);
      case 'code': return matchField(p.code, lower);
      case 'description': return matchField(p.description, lower);
      default: // 'all'
        return matchField(p.name, lower)
            || matchField(p.code, lower)
            || matchField(p.description, lower);
    }
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InvoiceApiService {
  async listInvoices(limit = 150): Promise<PaginatedResponse<InvoiceRowDto>> {
    if (USE_MOCK) return mockPaginated(MOCK_INVOICES, 1, limit);
    const response = await fetch(`${API_BASE_URL}/invoices?page=1&limit=${limit}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<InvoiceRowDto>>;
  }

  async searchCustomers(q: string, limit = 20): Promise<PaginatedResponse<CustomerRowDto>> {
    if (USE_MOCK) {
      const filtered = filterCustomers(MOCK_CUSTOMERS, q, 'all');
      return mockPaginated(filtered, 1, limit);
    }
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await fetch(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<CustomerRowDto>>;
  }

  async fetchCustomersPage(q: string, page: number, limit = 10, filterField = 'all'): Promise<PaginatedResponse<CustomerRowDto>> {
    if (USE_MOCK) {
      const filtered = filterCustomers(MOCK_CUSTOMERS, q, filterField);
      return mockPaginated(filtered, page, limit);
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await fetch(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<CustomerRowDto>>;
  }

  async searchProducts(q: string, limit = 20): Promise<PaginatedResponse<ProductRowDto>> {
    if (USE_MOCK) {
      const filtered = filterProducts(MOCK_PRODUCTS, q, 'all');
      return mockPaginated(filtered, 1, limit);
    }
    const params = new URLSearchParams({ page: '1', limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<ProductRowDto>>;
  }

  async fetchProductsPage(q: string, page: number, limit = 10, filterField = 'all'): Promise<PaginatedResponse<ProductRowDto>> {
    if (USE_MOCK) {
      const filtered = filterProducts(MOCK_PRODUCTS, q, filterField);
      return mockPaginated(filtered, page, limit);
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json() as Promise<PaginatedResponse<ProductRowDto>>;
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRowDto> {
    if (USE_MOCK) {
      invoiceCounter++;
      const subtotal = MOCK_PRODUCTS
        .filter((p) => payload.items.some((i) => i.productId === p.id))
        .reduce((sum, p) => {
          const item = payload.items.find((i) => i.productId === p.id)!;
          return sum + p.unitPrice * item.quantity;
        }, 0);
      const customer = MOCK_CUSTOMERS.find((c) => c.id === payload.customerId);
      return {
        id: `inv-${String(invoiceCounter).padStart(3, '0')}`,
        invoiceNumber: `FAC-${String(invoiceCounter).padStart(3, '0')}`,
        invoiceDate: new Date().toISOString(),
        customerId: payload.customerId,
        customerName: customer ? `${customer.name} ${customer.lastName}` : undefined,
        subtotal,
        iva: subtotal * 0.15,
        total: subtotal * 1.15,
      };
    }
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

  async createCustomer(payload: CreateCustomerPayload): Promise<CustomerRowDto> {
    if (USE_MOCK) {
      const newCustomer: CustomerRowDto = {
        id: `c${String(MOCK_CUSTOMERS.length + 1).padStart(3, '0')}`,
        name: payload.firstName,
        lastName: payload.lastName,
        cedula: payload.cedula,
        email: payload.email,
        phone: payload.phone,
      };
      MOCK_CUSTOMERS.push(newCustomer);
      return newCustomer;
    }
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string };
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<CustomerRowDto>;
  }

  invoicePdfUrl(id: string): string {
    if (USE_MOCK) return '#';
    return `${API_BASE_URL}/invoices/${id}/pdf`;
  }
}
