import type { CustomerEntity } from '../domain/customer.entity';
import type { BackendCustomer } from './customer-remote.datasource';

export function mapBackendToEntity(b: BackendCustomer): CustomerEntity {
  return {
    id: b.id,
    firstName: b.firstName,
    lastName: b.lastName ?? '',
    cedula: b.cedula,
    email: b.email ?? null,
    phone: b.phone ?? null,
    address: b.address ?? null,
    isActive: b.isActive === true || b.isActive === 1,
  };
}
