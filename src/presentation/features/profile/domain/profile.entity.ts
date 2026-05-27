export interface ProfileEntity {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  googleEmail?: string;
}
