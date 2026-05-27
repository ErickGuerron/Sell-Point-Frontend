import type { ProfileEntity } from '../domain/profile.entity';
import type { ProfileRawDto } from './profile.dto';

export function toProfileEntity(
  dto: ProfileRawDto,
): ProfileEntity {
  return {
    id: dto.id ?? dto.user?.id ?? '',
    name: dto.name ?? dto.user?.name ?? '',
    email: dto.email ?? dto.user?.email ?? '',
    role: dto.role ?? dto.user?.role ?? '',
    isActive:
      dto.isActive ?? dto.user?.isActive ?? true,
    failedLoginAttempts:
      dto.failedLoginAttempts ??
      dto.user?.failedLoginAttempts ??
      0,
  };
}