import { Injectable, inject } from '@angular/core';
import { CustomerRepository } from '../customer.repository';
import type { CustomerEntity, CreateCustomerPayload } from '../customer.entity';

@Injectable()
export class CreateCustomerUseCase {
  private readonly repo = inject(CustomerRepository);

  async execute(payload: CreateCustomerPayload): Promise<CustomerEntity> {
    return this.repo.create(payload);
  }
}
