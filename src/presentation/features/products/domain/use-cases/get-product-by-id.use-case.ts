import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductEntity } from '../product.entity';

@Injectable()
export class GetProductByIdUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(id: string, signal?: AbortSignal): Promise<ProductEntity> {
    return this.repo.getProductById(id, signal);
  }
}
