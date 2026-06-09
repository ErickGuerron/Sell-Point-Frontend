import type { ProfileEntity } from './profile.entity';
import type { UpdateProfilePayload } from '../data/profile.dto';

export abstract class ProfileRepository {
  abstract getProfile(
    signal?: AbortSignal,
  ): Promise<ProfileEntity>;

  abstract updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<ProfileEntity>;
}
