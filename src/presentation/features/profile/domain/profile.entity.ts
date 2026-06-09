export interface ProfileEntity {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name: string;
  email: string;
  cedula?: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  googleEmail?: string;
  googleId?: string;
}
