import { TestBed } from '@angular/core/testing';
import { ProfileStore } from './profile-store';
import { ProfileRepository } from './domain/profile.repository';
import { GoogleAuthService } from '../../shared/services/google-auth.service';
import { AuthHttpService } from '../../shared/services/auth-http.service';
import { GoogleAuthError } from '../../shared/services/google-auth.service';

describe('ProfileStore', () => {
  let store: ProfileStore;
  let mockRepository: jasmine.SpyObj<ProfileRepository>;
  let mockGoogleAuth: jasmine.SpyObj<GoogleAuthService>;
  let mockAuthHttp: jasmine.SpyObj<AuthHttpService>;

  const mockProfile = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    isActive: true,
    failedLoginAttempts: 0,
    googleEmail: undefined,
    googleId: undefined,
  };

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj<ProfileRepository>('ProfileRepository', ['getProfile']);
    mockGoogleAuth = jasmine.createSpyObj<GoogleAuthService>('GoogleAuthService', ['signIn', 'requestIdToken']);
    mockAuthHttp = jasmine.createSpyObj<AuthHttpService>('AuthHttpService', ['fetchWithRefresh']);

    TestBed.configureTestingModule({
      providers: [
        ProfileStore,
        { provide: ProfileRepository, useValue: mockRepository },
        { provide: GoogleAuthService, useValue: mockGoogleAuth },
        { provide: AuthHttpService, useValue: mockAuthHttp },
      ],
    });

    store = TestBed.inject(ProfileStore);
  });

  describe('initial state', () => {
    it('should have googleLinked false by default', () => {
      expect(store.googleLinked()).toBeFalse();
    });

    it('should have googleEmail null by default', () => {
      expect(store.googleEmail()).toBeNull();
    });

    it('should have googleLoading false by default', () => {
      expect(store.googleLoading()).toBeFalse();
    });
  });

  describe('loadProfile', () => {
    it('should set googleLinked true when profile has googleId', async () => {
      mockRepository.getProfile.and.resolveTo({ ...mockProfile, googleId: 'google-uid-123' });
      await store.loadProfile();
      expect(store.googleLinked()).toBeTrue();
      expect(store.googleEmail()).toBeNull();
    });

    it('should keep googleLinked false when profile has no googleId', async () => {
      mockRepository.getProfile.and.resolveTo(mockProfile);
      await store.loadProfile();
      expect(store.googleLinked()).toBeFalse();
      expect(store.googleEmail()).toBeNull();
    });

    it('should set loading during load', async () => {
      mockRepository.getProfile.and.resolveTo(mockProfile);
      const loadPromise = store.loadProfile();
      expect(store.loading()).toBeTrue();
      await loadPromise;
      expect(store.loading()).toBeFalse();
    });
  });

  describe('linkGoogle', () => {
    it('should set googleLoading true during linking', async () => {
      mockGoogleAuth.requestIdToken.and.resolveTo({ idToken: 'token123', email: 'google@test.com' });
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response('{}', { status: 200 }));

      const linkPromise = store.linkGoogle();
      expect(store.googleLoading()).toBeTrue();
      await linkPromise;
      expect(store.googleLoading()).toBeFalse();
    });

    it('should set googleLinked true and set email on success', async () => {
      mockGoogleAuth.requestIdToken.and.resolveTo({ idToken: 'token123', email: 'google@test.com' });
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response('{}', { status: 200 }));

      await store.linkGoogle();
      expect(store.googleLinked()).toBeTrue();
      expect(store.googleEmail()).toBe('google@test.com');
    });

    it('should throw GoogleAuthError on HTTP error', async () => {
      mockGoogleAuth.requestIdToken.and.resolveTo({ idToken: 'token123' });
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify({ error: 'GOOGLE_EMAIL_MISMATCH' }), { status: 403 }));

      await expectAsync(store.linkGoogle()).toBeRejectedWith(jasmine.any(GoogleAuthError));
    });
  });

  describe('unlinkGoogle', () => {
    it('should set googleLoading true during unlinking', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response('{}', { status: 200 }));

      // Pre-set linked state
      store.googleLinked.set(true);
      store.googleEmail.set('google@test.com');

      const unlinkPromise = store.unlinkGoogle();
      expect(store.googleLoading()).toBeTrue();
      await unlinkPromise;
      expect(store.googleLoading()).toBeFalse();
    });

    it('should reset googleLinked and googleEmail on success', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response('{}', { status: 200 }));
      store.googleLinked.set(true);
      store.googleEmail.set('google@test.com');

      await store.unlinkGoogle();
      expect(store.googleLinked()).toBeFalse();
      expect(store.googleEmail()).toBeNull();
    });

    it('should throw GoogleAuthError on HTTP error', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify({ error: 'GOOGLE_DUPLICATE_LINK' }), { status: 409 }));
      store.googleLinked.set(true);

      await expectAsync(store.unlinkGoogle()).toBeRejectedWith(jasmine.any(GoogleAuthError));
    });
  });
});
