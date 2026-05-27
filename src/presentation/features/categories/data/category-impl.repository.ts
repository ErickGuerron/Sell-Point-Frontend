import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '../domain/category.repository';
import type {
  CategoryEntity,
  CategoryFilters,
  PaginatedCategories,
  CategoryAggregates,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../domain/category.entity';
import { CategoryRemoteDataSource } from './category-remote-datasource';
import { mapToEntity } from './category.mapper';

@Injectable()
export class CategoryImplRepository extends CategoryRepository {
  private readonly ds = inject(CategoryRemoteDataSource);

  async getCategories(filters: CategoryFilters, signal?: AbortSignal): Promise<PaginatedCategories> {
    const page = await this.ds.fetchPage(filters.query, filters.page, filters.limit, signal);
    return {
      data: page.data.map(mapToEntity),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }

  async getCategoryAggregates(_signal?: AbortSignal): Promise<CategoryAggregates> {
    // TODO(backend): implement /categories/aggregates endpoint
    return { totalCategories: 0, activeCount: 0 };
  }

  async listAllCategories(): Promise<CategoryEntity[]> {
    const raw = await this.ds.listAll();
    return raw.map(mapToEntity);
  }

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryEntity> {
    const raw = await this.ds.create(payload);
    return mapToEntity(raw);
  }

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryEntity> {
    const raw = await this.ds.update(id, payload);
    return mapToEntity(raw);
  }

  async toggleCategoryActive(id: string, currentActive: boolean): Promise<CategoryEntity> {
    const raw = await this.ds.toggleActive(id, currentActive);
    return mapToEntity(raw);
  }
}
