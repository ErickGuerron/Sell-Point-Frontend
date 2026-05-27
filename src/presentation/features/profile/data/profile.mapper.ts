import type { ProfileEntity } from '../domain/profile.entity';
import type { ProfileRawDto } from './profile.dto';

export function toProfileEntity(
  dto: ProfileRawDto,
): ProfileEntity {
  const fullName = dto.fullName
    ?? dto.user?.fullName
    ?? [dto.firstName ?? dto.user?.firstName, dto.lastName ?? dto.user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

  return {
    id: dto.id ?? dto.user?.id ?? '',
    // Prefer human-readable identity over technical IDs.
    firstName: dto.firstName ?? dto.user?.firstName,
    lastName: dto.lastName ?? dto.user?.lastName,
    fullName: fullName || undefined,
    name: dto.name ?? dto.user?.name ?? dto.username ?? dto.user?.username ?? fullName ?? '',
    email: dto.email ?? dto.user?.email ?? '',
    role: dto.role ?? dto.user?.role ?? '',
    isActive:
      dto.isActive ?? dto.user?.isActive ?? true,
    failedLoginAttempts:
      dto.failedLoginAttempts ??
      dto.user?.failedLoginAttempts ??
      0,
    googleEmail: dto.googleEmail ?? dto.user?.googleEmail ?? undefined,
  };
}
