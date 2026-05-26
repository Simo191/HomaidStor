export type AuthProvider = 'Local' | 'Google' | 'Facebook';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  principalType: 'customer' | 'admin';
  preferredLanguage: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  user: AuthenticatedUser;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  preferredLanguage?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  phone?: string;
}

export interface FacebookLoginRequest {
  accessToken: string;
  phone?: string;
}
