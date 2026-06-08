import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '../category.repository';
import type { CategoryEntity } from '../category.entity';

@Injectable()
export class ToggleCategoryActiveUseCase {
  private readonly repo = inject(CategoryRepository);

  async execute(id: string, currentActive: boolean): Promise<CategoryEntity> {
    return this.repo.toggleCategoryActive(id, currentActive);
  }
}
