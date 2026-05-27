// ─── Domain entity — pure TypeScript, zero framework imports ───────────────

export interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email?: string;
  phone?: string;
  address?: string;
}
