export interface CategoryEntity {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CategoryFilters {
  query: string;
  page: number;
  limit: number;
}

export interface PaginatedCategories {
  data: CategoryEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryAggregates {
  totalCategories: number;
  activeCount: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}
