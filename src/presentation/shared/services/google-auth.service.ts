import { Injectable } from '@angular/core';
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';

export interface GoogleSignInResult {
  idToken: string;
  email?: string;
}

export type GoogleAuthErrorCode =
  | 'GOOGLE_TOKEN_INVALID'
  | 'GOOGLE_EMAIL_NOT_VERIFIED'
  | 'GOOGLE_EMAIL_MISMATCH'
  | 'GOOGLE_DUPLICATE_LINK'
  | 'GOOGLE_NO_ACCOUNT'
  | 'GOOGLE_AUTH_UNAVAILABLE'
  | 'GOOGLE_POPUP_NOT_DISPLAYED'
  | 'GOOGLE_POPUP_SKIPPED';

export class GoogleAuthError extends Error {
  override name = 'GoogleAuthError' as const;

  constructor(
    public readonly code: GoogleAuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GoogleAuthError';
  }

  static fromHttp(status: number, body?: { error?: string }): GoogleAuthError {
    const errorCode = body?.error as GoogleAuthErrorCode | undefined;

    if (status === 401 && errorCode === 'GOOGLE_EMAIL_NOT_VERIFIED') {
      return new GoogleAuthError(
        'GOOGLE_EMAIL_NOT_VERIFIED',
        'Your Google account email must be verified.',
      );
    }
    if (status === 403 && errorCode === 'GOOGLE_EMAIL_MISMATCH') {
      return new GoogleAuthError(
        'GOOGLE_EMAIL_MISMATCH',
        'Google email does not match your account email.',
      );
    }
    if (status === 409 && errorCode === 'GOOGLE_DUPLICATE_LINK') {
      return new GoogleAuthError(
        'GOOGLE_DUPLICATE_LINK',
        'This Google account is already linked to another user.',
      );
    }
    if (status === 404 && errorCode === 'GOOGLE_NO_ACCOUNT') {
      return new GoogleAuthError(
        'GOOGLE_NO_ACCOUNT',
        'No account found for this Google user. Please register first.',
      );
    }
    if (status === 401 && errorCode === 'GOOGLE_TOKEN_INVALID') {
      return new GoogleAuthError(
        'GOOGLE_TOKEN_INVALID',
        'Google verification failed. Please try again.',
      );
    }
    return new GoogleAuthError(
      'GOOGLE_TOKEN_INVALID',
      'Google verification failed. Please try again.',
    );
  }

  static network(): GoogleAuthError {
    return new GoogleAuthError(
      'GOOGLE_TOKEN_INVALID',
      'Connection error. Please check your internet.',
    );
  }

  static authUnavailable(message = 'Google auth is not configured.'): GoogleAuthError {
    return new GoogleAuthError('GOOGLE_AUTH_UNAVAILABLE', message);
  }

  static popupNotDisplayed(): GoogleAuthError {
    return new GoogleAuthError(
      'GOOGLE_POPUP_NOT_DISPLAYED',
      'Google sign-in could not open. Allow popups and try again.',
    );
  }

  static popupSkipped(): GoogleAuthError {
    return new GoogleAuthError(
      'GOOGLE_POPUP_SKIPPED',
      'Google sign-in was skipped. Please try again.',
    );
  }
}

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private firebaseApp: firebaseApp.FirebaseApp | null = null;
  private firebaseAuth: firebaseAuth.Auth | null = null;

  async signIn(): Promise<GoogleSignInResult> {
    return this.requestCredential();
  }

  async requestIdToken(): Promise<GoogleSignInResult> {
    return this.requestCredential();
  }

  private async requestCredential(): Promise<GoogleSignInResult> {
    const auth = this.getFirebaseAuth();
    const provider = new firebaseAuth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await firebaseAuth.signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken(true);
      return {
        idToken,
        email: user.email ?? undefined,
      };
    } catch (err) {
      throw this.mapFirebaseError(err);
    }
  }

  private getFirebaseAuth(): firebaseAuth.Auth {
    if (this.firebaseAuth) return this.firebaseAuth;

    if (!this.isFirebaseConfigComplete()) {
      throw GoogleAuthError.authUnavailable(
        'Firebase Google auth is not configured. Missing PUBLIC_FIREBASE_* env vars.',
      );
    }

    this.firebaseApp = firebaseApp.getApps().length
      ? firebaseApp.getApp()
      : firebaseApp.initializeApp(FIREBASE_CONFIG);

    this.firebaseAuth = firebaseAuth.getAuth(this.firebaseApp);
    return this.firebaseAuth;
  }

  private isFirebaseConfigComplete(): boolean {
    return Boolean(
      FIREBASE_CONFIG.apiKey
      && FIREBASE_CONFIG.authDomain
      && FIREBASE_CONFIG.projectId
      && FIREBASE_CONFIG.storageBucket
      && FIREBASE_CONFIG.messagingSenderId
      && FIREBASE_CONFIG.appId,
    );
  }

  private mapFirebaseError(err: unknown): GoogleAuthError {
    const code = this.extractErrorCode(err);

    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return GoogleAuthError.popupNotDisplayed();
    }
    if (code === 'auth/network-request-failed') {
      return GoogleAuthError.network();
    }
    if (code === 'auth/unauthorized-domain' || code === 'auth/configuration-not-found') {
      return GoogleAuthError.authUnavailable('Firebase Google auth is not configured for this domain.');
    }

    return new GoogleAuthError(
      'GOOGLE_TOKEN_INVALID',
      err instanceof Error && err.message
        ? err.message
        : 'Google verification failed. Please try again.',
    );
  }

  private extractErrorCode(err: unknown): string | undefined {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code?: unknown }).code;
      return typeof code === 'string' ? code : undefined;
    }
    return undefined;
  }
}
