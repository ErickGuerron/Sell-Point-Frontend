import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductMovementEntity, PaginatedProducts } from '../product.entity';

@Injectable()
export class GetProductMovementsUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(
    productId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedProducts & { data: ProductMovementEntity[] }> {
    return this.repo.getProductMovements(productId, page, limit);
  }
}
