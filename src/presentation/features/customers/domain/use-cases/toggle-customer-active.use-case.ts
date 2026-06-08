import { Injectable, inject } from '@angular/core';
import { CustomerRepository } from '../customer.repository';
import type { CustomerEntity } from '../customer.entity';

@Injectable()
export class ToggleCustomerActiveUseCase {
  private readonly repo = inject(CustomerRepository);

  async execute(id: string, currentActive: boolean): Promise<CustomerEntity> {
    return this.repo.toggleActive(id, currentActive);
  }
}
