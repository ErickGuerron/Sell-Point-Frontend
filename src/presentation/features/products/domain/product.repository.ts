import type {
  ProductEntity,
  ProductMovementEntity,
  ProductFilters,
  PaginatedProducts,
  ProductAggregates,
  StockAdjustmentPayload,
  CreateProductPayload,
  UpdateProductPayload,
} from './product.entity';

/** Abstract repository — domain contract, zero framework dependencies. */
export abstract class ProductRepository {
  abstract getProducts(
    filters: ProductFilters,
    signal?: AbortSignal,
  ): Promise<PaginatedProducts>;

  abstract getProductAggregates(
    signal?: AbortSignal,
  ): Promise<ProductAggregates>;

  abstract createProduct(
    payload: CreateProductPayload,
  ): Promise<ProductEntity>;

  abstract updateProduct(
    id: string,
    payload: UpdateProductPayload,
  ): Promise<ProductEntity>;

  abstract toggleProductActive(
    id: string,
    currentActive: boolean,
  ): Promise<ProductEntity>;

  abstract getProductMovements(
    productId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedProducts & { data: ProductMovementEntity[] }>;

  abstract adjustStock(
    productId: string,
    payload: StockAdjustmentPayload,
  ): Promise<ProductMovementEntity>;
}
