import { TestBed } from '@angular/core/testing';
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { GoogleAuthService, GoogleAuthError } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleAuthService);
    (service as any).firebaseApp = null;
    (service as any).firebaseAuth = null;
  });

  describe('GoogleAuthError', () => {
    it('should create error with code and message', () => {
      const error = new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'Test message');
      expect(error.code).toBe('GOOGLE_TOKEN_INVALID');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('GoogleAuthError');
    });

    describe('fromHttp', () => {
      it('should map 401 GOOGLE_EMAIL_NOT_VERIFIED', () => {
        const error = GoogleAuthError.fromHttp(401, { error: 'GOOGLE_EMAIL_NOT_VERIFIED' });
        expect(error.code).toBe('GOOGLE_EMAIL_NOT_VERIFIED');
        expect(error.message).toBe('Your Google account email must be verified.');
      });

      it('should map 403 GOOGLE_EMAIL_MISMATCH', () => {
        const error = GoogleAuthError.fromHttp(403, { error: 'GOOGLE_EMAIL_MISMATCH' });
        expect(error.code).toBe('GOOGLE_EMAIL_MISMATCH');
        expect(error.message).toBe('Google email does not match your account email.');
      });

      it('should map 409 GOOGLE_DUPLICATE_LINK', () => {
        const error = GoogleAuthError.fromHttp(409, { error: 'GOOGLE_DUPLICATE_LINK' });
        expect(error.code).toBe('GOOGLE_DUPLICATE_LINK');
        expect(error.message).toBe('This Google account is already linked to another user.');
      });

      it('should map 404 GOOGLE_NO_ACCOUNT', () => {
        const error = GoogleAuthError.fromHttp(404, { error: 'GOOGLE_NO_ACCOUNT' });
        expect(error.code).toBe('GOOGLE_NO_ACCOUNT');
        expect(error.message).toBe('No account found for this Google user. Please register first.');
      });

      it('should map 401 GOOGLE_TOKEN_INVALID', () => {
        const error = GoogleAuthError.fromHttp(401, { error: 'GOOGLE_TOKEN_INVALID' });
        expect(error.code).toBe('GOOGLE_TOKEN_INVALID');
        expect(error.message).toBe('Google verification failed. Please try again.');
      });

      it('should default unknown errors to GOOGLE_TOKEN_INVALID with generic message', () => {
        const error = GoogleAuthError.fromHttp(500, {});
        expect(error.code).toBe('GOOGLE_TOKEN_INVALID');
        expect(error.message).toBe('Google verification failed. Please try again.');
      });
    });

    it('should create network error', () => {
      const error = GoogleAuthError.network();
      expect(error.code).toBe('GOOGLE_TOKEN_INVALID');
      expect(error.message).toBe('Connection error. Please check your internet.');
    });
  });

  describe('signIn', () => {
    it('should reject when popup is blocked', async () => {
      const spy = spyOn<any>(service, 'isFirebaseConfigComplete').and.returnValue(true);
      spyOn(firebaseApp, 'getApps').and.returnValue([] as any);
      spyOn(firebaseApp, 'initializeApp').and.returnValue({} as any);
      spyOn(firebaseAuth, 'getAuth').and.returnValue({} as any);
      spyOn(firebaseAuth, 'signInWithPopup').and.rejectWith({ code: 'auth/popup-blocked' });

      await expectAsync(service.signIn()).toBeRejectedWith(jasmine.objectContaining({ code: 'GOOGLE_POPUP_NOT_DISPLAYED' }));
    });

    it('should return idToken and email from Firebase user', async () => {
      spyOn<any>(service, 'isFirebaseConfigComplete').and.returnValue(true);
      spyOn(firebaseApp, 'getApps').and.returnValue([] as any);
      spyOn(firebaseApp, 'initializeApp').and.returnValue({} as any);
      spyOn(firebaseAuth, 'getAuth').and.returnValue({} as any);

      const getIdToken = jasmine.createSpy('getIdToken').and.resolveTo('firebase.id.token');
      spyOn(firebaseAuth, 'signInWithPopup').and.resolveTo({
        user: { email: 'google@test.com', getIdToken },
      } as any);

      const result = await service.signIn();
      expect(result.idToken).toBe('firebase.id.token');
      expect(result.email).toBe('google@test.com');
    });
  });

  describe('requestIdToken', () => {
    it('should reject when Firebase auth is not configured', async () => {
      spyOn<any>(service, 'isFirebaseConfigComplete').and.returnValue(false);
      await expectAsync(service.requestIdToken()).toBeRejectedWith(jasmine.objectContaining({ code: 'GOOGLE_AUTH_UNAVAILABLE' }));
    });
  });
});
