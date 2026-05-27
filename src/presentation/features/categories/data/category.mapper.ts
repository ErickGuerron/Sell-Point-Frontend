import type { CategoryEntity } from '../domain/category.entity';
import type { CategoryRawDto } from './category-remote-datasource';

export function mapToEntity(dto: CategoryRawDto): CategoryEntity {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    isActive: dto.isActive === true || dto.isActive === 1,
  };
}
