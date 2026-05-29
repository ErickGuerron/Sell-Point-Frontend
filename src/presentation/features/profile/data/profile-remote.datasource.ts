import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';
import type { ProfileRawDto } from './profile.dto';
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
}
