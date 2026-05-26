import { AuthProvider } from './auth.models';

export interface CustomerProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  preferredLanguage?: string;
}

export interface CustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  streetComplement?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  isDefault: boolean;
}

export interface UpsertAddressRequest {
  fullName: string;
  phone: string;
  street: string;
  streetComplement?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  isDefault: boolean;
}
