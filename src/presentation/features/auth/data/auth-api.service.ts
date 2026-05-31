import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { resolveApiBaseUrl } from '../../../shared/services/api-base';

const API_BASE_URL = resolveApiBaseUrl();

export interface AuthLoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface GoogleLoginPayload {
  idToken: string;
}

export type AuthSessionDto = Record<string, unknown>;

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordTokenValidationDto {
  valid: boolean;
  reason?: 'invalid' | 'expired' | 'used';
}

@Injectable()
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: AuthLoginPayload): Promise<AuthSessionDto> {
    return firstValueFrom(this.http.post<AuthSessionDto>(`${API_BASE_URL}/auth/login`, payload));
  }

  loginWithGoogle(idToken: string): Promise<AuthSessionDto> {
    return firstValueFrom(this.http.post<AuthSessionDto>(`${API_BASE_URL}/auth/login-google`, { idToken } satisfies GoogleLoginPayload));
  }

  requestPasswordReset(email: string): Promise<unknown> {
    return firstValueFrom(this.http.post<unknown>(`${API_BASE_URL}/auth/password-reset`, { email }));
  }

  validateResetToken(token: string): Promise<ResetPasswordTokenValidationDto> {
    return firstValueFrom(this.http.get<ResetPasswordTokenValidationDto>(`${API_BASE_URL}/auth/reset-password/validate`, {
      params: { token },
    }));
  }

  resetPassword(payload: ResetPasswordPayload): Promise<unknown> {
    return firstValueFrom(this.http.post<unknown>(`${API_BASE_URL}/auth/reset-password`, payload));
  }
}
