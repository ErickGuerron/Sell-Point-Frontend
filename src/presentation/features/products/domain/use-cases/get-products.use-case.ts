import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductFilters, PaginatedProducts } from '../product.entity';

@Injectable()
export class GetProductsUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(
    filters: ProductFilters,
    signal?: AbortSignal,
  ): Promise<PaginatedProducts> {
    return this.repo.getProducts(filters, signal);
  }
}
