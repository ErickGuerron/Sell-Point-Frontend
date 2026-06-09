import { Injectable, inject } from '@angular/core';

import { ProfileRepository } from '../domain/profile.repository';

import type { ProfileEntity } from '../domain/profile.entity';

import { ProfileRemoteDataSource } from './profile-remote.datasource';

import { toProfileEntity } from './profile.mapper';
import type { UpdateProfilePayload } from './profile.dto';

@Injectable()
export class ProfileImplRepository
  extends ProfileRepository
{
  private readonly ds = inject(
    ProfileRemoteDataSource,
  );

  async getProfile(): Promise<ProfileEntity> {
    const dto = await this.ds.fetchProfile();

    return toProfileEntity(dto);
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileEntity> {
    const dto = await this.ds.updateProfile(payload);

    return toProfileEntity(dto);
  }
}
