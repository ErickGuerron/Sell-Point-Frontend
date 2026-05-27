import { Injectable, inject } from '@angular/core';

import { ProfileRepository } from '../profile.repository';

import type { ProfileEntity } from '../profile.entity';

@Injectable({
  providedIn: 'root',
})
export class GetProfileUseCase {
  private readonly repository = inject(
    ProfileRepository,
  );

  execute(
    signal?: AbortSignal,
  ): Promise<ProfileEntity> {
    return this.repository.getProfile(signal);
  }
}