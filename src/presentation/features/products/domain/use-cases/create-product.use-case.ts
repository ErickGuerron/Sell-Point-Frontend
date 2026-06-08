import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductEntity, CreateProductPayload } from '../product.entity';

@Injectable()
export class CreateProductUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(payload: CreateProductPayload): Promise<ProductEntity> {
    return this.repo.createProduct(payload);
  }
}
