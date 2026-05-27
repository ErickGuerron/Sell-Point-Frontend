import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '../category.repository';
import type { CategoryFilters, PaginatedCategories } from '../category.entity';

@Injectable()
export class GetCategoriesUseCase {
  private readonly repo = inject(CategoryRepository);

  async execute(filters: CategoryFilters, signal?: AbortSignal): Promise<PaginatedCategories> {
    return this.repo.getCategories(filters, signal);
  }
}
