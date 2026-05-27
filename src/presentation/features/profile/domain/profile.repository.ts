import type { ProfileEntity } from './profile.entity';

export abstract class ProfileRepository {
  abstract getProfile(
    signal?: AbortSignal,
  ): Promise<ProfileEntity>;
}