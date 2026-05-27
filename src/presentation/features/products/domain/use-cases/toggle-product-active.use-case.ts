import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductEntity } from '../product.entity';

@Injectable()
export class ToggleProductActiveUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(
    id: string,
    currentActive: boolean,
  ): Promise<ProductEntity> {
    return this.repo.toggleProductActive(id, currentActive);
  }
}
