import type { CustomerEntity, CreateCustomerPayload } from './customer.entity';

export interface CustomerListParams {
  page: number;
  limit: number;
  q?: string;
  cedula?: string;
  // Spec 4 R2: string-literal union (NOT boolean). The data source
  // URL-serialises this with URLSearchParams.set which always emits
  // a string. 'all' means "do not send the query param at all".
  isActive?: 'true' | 'false' | 'all';
  createdFrom?: string;
  createdTo?: string;
}

export interface CustomerPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerListResult {
  data: CustomerEntity[];
  pagination: CustomerPagination;
}

/** Abstract repository — domain contract, zero framework dependencies. */
export abstract class CustomerRepository {
  abstract list(params: CustomerListParams): Promise<CustomerListResult>;
  abstract create(payload: CreateCustomerPayload): Promise<CustomerEntity>;
  abstract update(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity>;
  abstract toggleActive(id: string, currentActive: boolean): Promise<CustomerEntity>;
}
