import { Injectable, inject } from '@angular/core';
import { CustomerRepository, type CustomerListParams, type CustomerListResult } from '../customer.repository';

@Injectable()
export class ListCustomersUseCase {
  private readonly repo = inject(CustomerRepository);

  async execute(params: CustomerListParams): Promise<CustomerListResult> {
    return this.repo.list(params);
  }
}
