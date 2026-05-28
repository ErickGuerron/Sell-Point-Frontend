import { Injectable, inject } from '@angular/core';
import {
  CustomerRepository,
  type CustomerListParams,
  type CustomerListResult,
} from '../domain/customer.repository';
import type { CustomerEntity, CreateCustomerPayload } from '../domain/customer.entity';
import { CustomerRemoteDataSource } from './customer-remote.datasource';
import { mapBackendToEntity } from './customer.mapper';

@Injectable()
export class CustomerImplRepository extends CustomerRepository {
  private readonly ds = inject(CustomerRemoteDataSource);

  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const result = await this.ds.list(params);
    return {
      data: result.data.map(mapBackendToEntity),
      pagination: result.pagination,
    };
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
