import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';
import type { ProfileRawDto, UpdateProfilePayload } from './profile.dto';
import { resolveApiBaseUrl } from '../../../shared/services/api-base';

const API_BASE = resolveApiBaseUrl();

@Injectable()
export class ProfileRemoteDataSource {
  private readonly authHttp = inject(AuthHttpService);

  async fetchProfile(): Promise<ProfileRawDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/auth/me`);

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`,
      );
    }

    return await response.json();
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileRawDto> {
    const response = await this.authHttp.fetchWithRefresh(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response));
    }

    return await response.json();
  }

  private async readErrorMessage(response: Response): Promise<string> {
    const text = await response.text().catch(() => '');
    if (!text) return `Request failed: ${response.status}`;

    try {
      const parsed = JSON.parse(text) as { message?: string | string[]; error?: string };
      if (Array.isArray(parsed.message)) return parsed.message.join(', ');
      return parsed.message || parsed.error || text;
    } catch {
      return text;
    }
  }
}
