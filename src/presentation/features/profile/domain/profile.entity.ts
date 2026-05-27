export interface ProfileEntity {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
}