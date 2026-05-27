import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ProfileRepository } from './domain/profile.repository';

import type { ProfileEntity } from './domain/profile.entity';

import { GoogleAuthService } from '../../shared/services/google-auth.service';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { GoogleAuthError } from '../../shared/services/google-auth.service';

const API_BASE =
  import.meta.env.PUBLIC_API_URL ||
  'http://localhost:3000';

@Injectable()
export class ProfileStore {
  private readonly repository = inject(
    ProfileRepository,
  );
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly authHttp = inject(AuthHttpService);

  readonly profile =
    signal<ProfileEntity | null>(null);

  readonly loading = signal(false);

  readonly error = signal(false);

  readonly errorMessage = signal<string | null>(null);

  readonly googleLinked = signal(false);

  readonly googleEmail = signal<string | null>(null);

  readonly googleLoading = signal(false);

  readonly initials = computed(() => {
    const name = this.profile()?.fullName ?? this.profile()?.name ?? '';

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
    if (typeof window === 'undefined') return;

    this.loading.set(true);
    this.error.set(false);
    this.errorMessage.set(null);

    try {
      const profile =
        await this.repository.getProfile();

      this.profile.set(profile);
      const gmail = profile.googleEmail ?? null;
      this.googleEmail.set(gmail);
      this.googleLinked.set(gmail != null);
    } catch (err) {
      this.error.set(true);
      this.errorMessage.set(err instanceof Error ? err.message : 'Unknown profile error');
      // eslint-disable-next-line no-console
      console.error('[ProfileStore.loadProfile]', err);
    } finally {
      this.loading.set(false);
    }
  }

  async linkGoogle(): Promise<void> {
    this.googleLoading.set(true);
    try {
      const { idToken } = await this.googleAuth.requestIdToken();
      const response = await this.authHttp.fetchWithRefresh(
        `${API_BASE}/auth/link-google`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        },
      );

      if (!response.ok) {
        const body = await this.readErrorBody(response);
        throw new Error(`link-google failed (${response.status}): ${body}`);
      }

      await this.loadProfile();
    } catch (err) {
      if (err instanceof GoogleAuthError) throw err;
      // eslint-disable-next-line no-console
      console.error('[ProfileStore.linkGoogle]', err);
      throw err instanceof Error ? err : new Error('link-google failed');
    } finally {
      this.googleLoading.set(false);
    }
  }

  async unlinkGoogle(): Promise<void> {
    this.googleLoading.set(true);
    try {
      const response = await this.authHttp.fetchWithRefresh(
        `${API_BASE}/auth/link-google`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        const body = await this.readErrorBody(response);
        throw new Error(`unlink-google failed (${response.status}): ${body}`);
      }

      await this.loadProfile();
    } catch (err) {
      if (err instanceof GoogleAuthError) throw err;
      // eslint-disable-next-line no-console
      console.error('[ProfileStore.unlinkGoogle]', err);
      throw err instanceof Error ? err : new Error('unlink-google failed');
    } finally {
      this.googleLoading.set(false);
    }
  }

  private async readErrorBody(response: Response): Promise<string> {
    try {
      const text = await response.text();
      if (!text) return response.statusText || 'Empty error body';

      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        return parsed.message || parsed.error || text;
      } catch {
        return text;
      }
    } catch (err) {
      return err instanceof Error ? err.message : 'Unable to read error body';
    }
  }
}
