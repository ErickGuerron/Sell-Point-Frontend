import type { CustomerEntity, CreateCustomerPayload } from './customer.entity';

/** Abstract repository — domain contract, zero framework dependencies. */
export abstract class CustomerRepository {
  abstract list(): Promise<CustomerEntity[]>;
  abstract create(payload: CreateCustomerPayload): Promise<CustomerEntity>;
  abstract update(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity>;
  abstract toggleActive(id: string, currentActive: boolean): Promise<CustomerEntity>;
}
