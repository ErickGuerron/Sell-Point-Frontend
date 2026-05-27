import type {
  CategoryEntity,
  CategoryFilters,
  PaginatedCategories,
  CategoryAggregates,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from './category.entity';

export abstract class CategoryRepository {
  abstract getCategories(filters: CategoryFilters, signal?: AbortSignal): Promise<PaginatedCategories>;
  abstract getCategoryAggregates(signal?: AbortSignal): Promise<CategoryAggregates>;
  abstract listAllCategories(): Promise<CategoryEntity[]>;
  abstract createCategory(payload: CreateCategoryPayload): Promise<CategoryEntity>;
  abstract updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryEntity>;
  abstract toggleCategoryActive(id: string, currentActive: boolean): Promise<CategoryEntity>;
}
