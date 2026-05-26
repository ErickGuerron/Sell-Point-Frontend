import { Injectable, inject } from '@angular/core';
import { CustomerRepository } from '../customer.repository';
import type { CustomerEntity } from '../customer.entity';

@Injectable()
export class ListCustomersUseCase {
  private readonly repo = inject(CustomerRepository);

  async execute(): Promise<CustomerEntity[]> {
    const customers = await this.repo.list();
    return customers.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.firstName.localeCompare(b.firstName);
    });
  }
}
