export interface ProfileRawDto {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  failedLoginAttempts?: number;

  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    failedLoginAttempts?: number;
  };
}