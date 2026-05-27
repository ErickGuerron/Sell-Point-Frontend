import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '../category.repository';
import type { CategoryEntity, CreateCategoryPayload } from '../category.entity';

@Injectable()
export class CreateCategoryUseCase {
  private readonly repo = inject(CategoryRepository);

  async execute(payload: CreateCategoryPayload): Promise<CategoryEntity> {
    return this.repo.createCategory(payload);
  }
}
