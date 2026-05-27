import { Injectable, inject } from '@angular/core';
import { CustomerRepository } from '../domain/customer.repository';
import type { CustomerEntity, CreateCustomerPayload } from '../domain/customer.entity';
import { CustomerRemoteDataSource } from './customer-remote.datasource';
import { mapBackendToEntity } from './customer.mapper';

@Injectable()
export class CustomerImplRepository extends CustomerRepository {
  private readonly ds = inject(CustomerRemoteDataSource);

  async list(): Promise<CustomerEntity[]> {
    const backends = await this.ds.list();
    return backends.map(mapBackendToEntity);
  }

  async create(payload: CreateCustomerPayload): Promise<CustomerEntity> {
    const backend = await this.ds.create(payload);
    return mapBackendToEntity(backend);
  }

  async update(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity> {
    const backend = await this.ds.update(id, payload);
    return mapBackendToEntity(backend);
  }

  async toggleActive(id: string, currentActive: boolean): Promise<CustomerEntity> {
    const backend = await this.ds.toggleActive(id, currentActive);
    return mapBackendToEntity(backend);
  }
}
