export interface ProfileRawDto {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  failedLoginAttempts?: number;
  googleId?: string;
  googleEmail?: string;

  user?: {
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    failedLoginAttempts?: number;
    googleId?: string;
    googleEmail?: string;
  };
}
