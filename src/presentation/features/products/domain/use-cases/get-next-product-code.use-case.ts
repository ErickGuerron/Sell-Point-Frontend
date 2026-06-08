import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../product.repository';

@Injectable()
export class GetNextProductCodeUseCase {
  private readonly repo = inject(ProductRepository);

  async execute(signal?: AbortSignal): Promise<string> {
    return this.repo.getNextProductCode(signal);
  }
}
