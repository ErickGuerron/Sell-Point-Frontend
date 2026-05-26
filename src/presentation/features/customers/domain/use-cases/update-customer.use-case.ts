import { Injectable, inject } from '@angular/core';
import { CustomerRepository } from '../customer.repository';
import type { CustomerEntity, CreateCustomerPayload } from '../customer.entity';

@Injectable()
export class UpdateCustomerUseCase {
  private readonly repo = inject(CustomerRepository);

  async execute(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity> {
    return this.repo.update(id, payload);
  }
}
