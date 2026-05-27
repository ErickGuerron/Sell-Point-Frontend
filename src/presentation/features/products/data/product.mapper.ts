import type { ProductEntity, ProductMovementEntity } from '../domain/product.entity';
import type { ProductRawDto, MovementRawDto } from './product-remote-datasource';

/** Convert a raw backend product DTO into a domain ProductEntity. */
export function toProductEntity(dto: ProductRawDto): ProductEntity {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description ?? undefined,
    salePrice: dto.salePrice,
    costPrice: dto.costPrice,
    currentStock: dto.currentStock,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    isActive: dto.isActive === true || dto.isActive === 1,
  };
}

/** Convert a raw backend movement DTO into a domain ProductMovementEntity. */
export function toMovementEntity(dto: MovementRawDto): ProductMovementEntity {
  // Normalise ADJUSTMENT → ADJUST (the backend sometimes uses different naming)
  let type: ProductMovementEntity['type'] = dto.type as ProductMovementEntity['type'];
  if (dto.type === 'ADJUSTMENT') type = 'ADJUST';

  return {
    id: dto.id,
    productId: dto.productId,
    type,
    quantity: dto.quantity,
    reason: dto.description ?? dto.reason ?? '',
    previousStock: dto.previousStock,
    newStock: dto.newStock,
    createdAt: dto.createdAt,
  };
}
