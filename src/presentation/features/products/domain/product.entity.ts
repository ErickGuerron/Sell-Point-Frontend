// ─── Domain entities — pure TypeScript, zero framework imports ───────────────

export interface ProductEntity {
  id: string;
  code: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
}

export interface ProductMovementEntity {
  id: number | string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'SALE';
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}

export interface ProductFilters {
  query: string;
  searchField: 'all' | 'code' | 'name';
  categoryId: string;
  isActive: string; // 'all' | 'active' | 'inactive'
  page: number;
  limit: number;
}

export interface PaginatedProducts {
  data: ProductEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductAggregates {
  totalProducts: number;
  activeCount: number;
  lowStockCount: number;
}

export type StockAdjustmentType = 'IN' | 'OUT' | 'ADJUST';

export interface StockAdjustmentPayload {
  type: StockAdjustmentType;
  quantity: number;
  description: string;
}

export interface CreateProductPayload {
  code: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  initialStock: number;
  categoryId: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  salePrice?: number;
  costPrice?: number;
  categoryId?: string;
}
