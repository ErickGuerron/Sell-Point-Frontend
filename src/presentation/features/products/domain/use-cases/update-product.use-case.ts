import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductEntity, UpdateProductPayload } from '../product.entity';

@Injectable()
export class UpdateProductUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(
    id: string,
    payload: UpdateProductPayload,
  ): Promise<ProductEntity> {
    return this.repo.updateProduct(id, payload);
  }
}
