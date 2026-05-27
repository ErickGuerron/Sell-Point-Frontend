import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';
import type { ProductMovementEntity, StockAdjustmentPayload } from '../product.entity';

@Injectable()
export class AdjustStockUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(
    productId: string,
    payload: StockAdjustmentPayload,
  ): Promise<ProductMovementEntity> {
    return this.repo.adjustStock(productId, payload);
  }
}
