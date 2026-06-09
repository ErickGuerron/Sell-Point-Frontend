import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ProfileRepository } from './domain/profile.repository';

import type { ProfileEntity } from './domain/profile.entity';
import type { UpdateProfilePayload } from './data/profile.dto';

import { GoogleAuthService } from '../../shared/services/google-auth.service';
import { AuthHttpService, type ChangePasswordPayload } from '../../shared/services/auth-http.service';
import { GoogleAuthError } from '../../shared/services/google-auth.service';
import { resolveApiBaseUrl } from '../../shared/services/api-base';

const API_BASE = resolveApiBaseUrl();

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

  readonly saving = signal(false);

  readonly firstName = signal('');

  readonly lastName = signal('');

  readonly email = signal('');

  readonly cedula = signal('');

  readonly passwordChanging = signal(false);

  readonly passwordFormOpen = signal(false);

  readonly currentPassword = signal('');

  readonly newPassword = signal('');

  readonly confirmPassword = signal('');

  readonly passwordError = signal<string | null>(null);

  readonly passwordErrorMessage = computed(() => this.passwordError());

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

  readonly formDirty = computed(() => {
    const profile = this.profile();
    if (!profile) return false;

    return (
      this.firstName().trim() !== (profile.firstName ?? '').trim()
      || this.lastName().trim() !== (profile.lastName ?? '').trim()
      || this.email().trim() !== profile.email.trim()
    );
  });

  readonly canSave = computed(() => {
    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();
    const email = this.email().trim();

    return Boolean(
      !this.saving()
      && this.profile()
      && this.formDirty()
      && firstName.length > 0
      && lastName.length > 0
      && email.length > 0
      && /.+@.+\..+/.test(email)
    );
  });

  readonly displayFullName = computed(() => {
    const fullName = this.profile()?.fullName?.trim();
    if (fullName) return fullName;
    const fallback = [this.firstName(), this.lastName()].filter(Boolean).join(' ').trim();
    return fallback || this.profile()?.name || '—';
  });

  readonly passwordFormDirty = computed(() => Boolean(
    this.currentPassword().length > 0
    || this.newPassword().length > 0
    || this.confirmPassword().length > 0,
  ));

  readonly passwordCanSave = computed(() => {
    const currentPassword = this.currentPassword().trim();
    const newPassword = this.newPassword().trim();
    const confirmPassword = this.confirmPassword().trim();

    return Boolean(
      !this.passwordChanging()
      && this.passwordFormOpen()
      && currentPassword.length >= 8
      && newPassword.length >= 8
      && confirmPassword.length >= 8
      && newPassword === confirmPassword
      && this.passwordFormDirty()
    );
  });

  setFirstName(value: string): void {
    this.firstName.set(value.trimStart());
  }

  setLastName(value: string): void {
    this.lastName.set(value.trimStart());
  }

  setEmail(value: string): void {
    this.email.set(value.trim());
  }

  setCurrentPassword(value: string): void {
    this.currentPassword.set(value);
    this.passwordError.set(null);
  }

  setNewPassword(value: string): void {
    this.newPassword.set(value);
    this.passwordError.set(null);
  }

  setConfirmPassword(value: string): void {
    this.confirmPassword.set(value);
    this.passwordError.set(null);
  }

  setInitialProfile(profile: ProfileEntity | null): void {
    this.profile.set(profile);
    this.error.set(false);
    this.errorMessage.set(null);
    this.loading.set(false);
    this.saving.set(false);
    this.passwordChanging.set(false);
    this.passwordFormOpen.set(false);

    if (!profile) {
      this.firstName.set('');
      this.lastName.set('');
      this.email.set('');
      this.cedula.set('');
      this.clearPasswordForm();
      this.googleLinked.set(false);
      this.googleEmail.set(null);
      return;
    }

    this.syncForm(profile);

    const linked = profile.googleId != null;
    this.googleLinked.set(linked);
    this.googleEmail.set(linked ? (profile.googleEmail ?? null) : null);
  }

  openPasswordForm(): void {
    this.passwordFormOpen.set(true);
    this.passwordError.set(null);
  }

  cancelPasswordForm(): void {
    this.passwordFormOpen.set(false);
    this.clearPasswordForm();
  }

  private clearPasswordForm(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordError.set(null);
  }

  resetFormFromProfile(): void {
    const profile = this.profile();
    if (!profile) return;
    this.syncForm(profile);
  }

  private syncForm(profile: ProfileEntity): void {
    this.firstName.set(profile.firstName ?? '');
    this.lastName.set(profile.lastName ?? '');
    this.email.set(profile.email ?? '');
    this.cedula.set(profile.cedula ?? '');
  }

  async loadProfile() {
    if (typeof window === 'undefined') return;

    this.loading.set(true);
    this.error.set(false);
    this.errorMessage.set(null);

    try {
      const profile =
        await this.repository.getProfile();

      if (!profile) {
        this.profile.set(null);
        this.firstName.set('');
        this.lastName.set('');
        this.email.set('');
        this.cedula.set('');
        this.googleLinked.set(false);
        this.googleEmail.set(null);
        return;
      }

      this.profile.set(profile);
      this.syncForm(profile);
      const linked = profile.googleId != null;
      this.googleLinked.set(linked);
      this.googleEmail.set(linked ? (profile.googleEmail ?? null) : null);
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
      const { idToken, email } = await this.googleAuth.requestIdToken();
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

      this.googleLinked.set(true);
      this.googleEmail.set(email ?? null);
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

      this.googleLinked.set(false);
      this.googleEmail.set(null);
    } catch (err) {
      if (err instanceof GoogleAuthError) throw err;
      // eslint-disable-next-line no-console
      console.error('[ProfileStore.unlinkGoogle]', err);
      throw err instanceof Error ? err : new Error('unlink-google failed');
    } finally {
      this.googleLoading.set(false);
    }
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileEntity> {
    this.saving.set(true);

    try {
      const profile = await this.repository.updateProfile(payload);
      this.profile.set(profile);
      this.syncForm(profile);
      const linked = profile.googleId != null;
      this.googleLinked.set(linked);
      this.googleEmail.set(linked ? (profile.googleEmail ?? null) : null);
      return profile;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProfileStore.updateProfile]', err);
      throw err instanceof Error ? err : new Error('Unknown profile error');
    } finally {
      this.saving.set(false);
    }
  }

  async changePassword(): Promise<void> {
    const payload: ChangePasswordPayload = {
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
      confirmPassword: this.confirmPassword(),
    };

    this.passwordChanging.set(true);
    this.passwordError.set(null);

    try {
      await this.authHttp.changePassword(payload);
      this.clearPasswordForm();
      this.passwordChanging.set(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown password error';
      this.passwordError.set(message);
      // eslint-disable-next-line no-console
      console.error('[ProfileStore.changePassword]', err);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      this.passwordChanging.set(false);
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
