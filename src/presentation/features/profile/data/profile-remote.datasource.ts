import { Injectable } from '@angular/core';
import type { ProfileRawDto } from './profile.dto';

const API_BASE =
  import.meta.env.PUBLIC_API_URL ||
  'http://localhost:3000';

@Injectable()
export class ProfileRemoteDataSource {
  async fetchProfile(): Promise<ProfileRawDto> {
    const raw =
      localStorage.getItem('billflow-session');

    if (!raw) {
      throw new Error('No session');
    }

    const session = JSON.parse(raw);

    const token =
      session.token ?? session.accessToken;

    const response = await fetch(
      `${API_BASE}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`,
      );
    }

    return await response.json();
  }
}