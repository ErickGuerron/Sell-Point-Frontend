import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../domain/product.repository';
import type {
  ProductEntity,
  ProductMovementEntity,
  ProductFilters,
  PaginatedProducts,
  PaginatedMovements,
  ProductAggregates,
  StockAdjustmentPayload,
  CreateProductPayload,
  UpdateProductPayload,
} from '../domain/product.entity';
import { ProductRemoteDataSource } from './product-remote-datasource';
import { toProductEntity, toMovementEntity } from './product.mapper';

@Injectable()
export class ProductImplRepository extends ProductRepository {
  private readonly ds = inject(ProductRemoteDataSource);

  async getProducts(filters: ProductFilters, signal?: AbortSignal): Promise<PaginatedProducts> {
    const page = await this.ds.fetchProductsPage(
      filters.query,
      filters.categoryId,
      filters.isActive,
      filters.page,
      filters.limit,
      signal,
    );
    return {
      data: page.data.map(toProductEntity),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }

  async getProductAggregates(_signal?: AbortSignal): Promise<ProductAggregates> {
    // TODO(fase-3): implement a dedicated backend endpoint or compute from cached results
    return { totalProducts: 0, activeCount: 0, lowStockCount: 0 };
  }

  async createProduct(payload: CreateProductPayload): Promise<ProductEntity> {
    const dto = await this.ds.createProduct(payload);
    return toProductEntity(dto);
  }

  async updateProduct(id: string, payload: UpdateProductPayload): Promise<ProductEntity> {
    const dto = await this.ds.updateProduct(id, payload);
    return toProductEntity(dto);
  }

  async toggleProductActive(id: string, currentActive: boolean): Promise<ProductEntity> {
    const dto = await this.ds.toggleProductActive(id, currentActive);
    return toProductEntity(dto);
  }

  async getProductMovements(
    productId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedMovements> {
    const result = await this.ds.fetchProductMovements(productId, page, limit);
    return {
      data: result.data.map(toMovementEntity),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async adjustStock(productId: string, payload: StockAdjustmentPayload): Promise<ProductMovementEntity> {
    const dto = await this.ds.adjustStock(productId, payload);
    return toMovementEntity(dto);
  }
}
