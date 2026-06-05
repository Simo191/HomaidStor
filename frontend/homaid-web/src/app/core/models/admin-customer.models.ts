import { AuthProvider } from './auth.models';

export interface AdminCustomerList {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  authProvider: AuthProvider;
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminCustomerAddress {
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

export interface AdminCustomerDetail {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orderCount: number;
  totalSpent: number;
  addresses: AdminCustomerAddress[];
}
