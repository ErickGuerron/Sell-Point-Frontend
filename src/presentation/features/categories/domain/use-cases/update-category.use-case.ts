import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '../category.repository';
import type { CategoryEntity, UpdateCategoryPayload } from '../category.entity';

@Injectable()
export class UpdateCategoryUseCase {
  private readonly repo = inject(CategoryRepository);

  async execute(id: string, payload: UpdateCategoryPayload): Promise<CategoryEntity> {
    return this.repo.updateCategory(id, payload);
  }
}
