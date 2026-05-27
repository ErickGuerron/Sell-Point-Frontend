import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ProfileRepository } from './domain/profile.repository';

import type { ProfileEntity } from './domain/profile.entity';

@Injectable()
export class ProfileStore {
  private readonly repository = inject(
    ProfileRepository,
  );

  readonly profile =
    signal<ProfileEntity | null>(null);

  readonly loading = signal(false);

  readonly error = signal(false);

  readonly initials = computed(() => {
    const name = this.profile()?.name ?? '';

    if (!name) return '?';

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  });

  readonly isActive = computed(
    () => this.profile()?.isActive ?? false,
  );

  readonly failedAttempts = computed(
    () =>
      this.profile()?.failedLoginAttempts ?? 0,
  );

  async loadProfile() {
    this.loading.set(true);
    this.error.set(false);

    try {
      const profile =
        await this.repository.getProfile();

      this.profile.set(profile);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}