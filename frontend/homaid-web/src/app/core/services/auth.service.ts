import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse, AuthenticatedUser, ChangePasswordRequest,
  FacebookLoginRequest, GoogleLoginRequest, LoginRequest, RegisterRequest
} from '../models/auth.models';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'homaid.auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  user: AuthenticatedUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);

  private _auth = signal<StoredAuth | null>(this.storage.get<StoredAuth>(STORAGE_KEY));

  readonly auth = this._auth.asReadonly();
  readonly user = computed(() => this._auth()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this._auth()?.accessToken);
  readonly isCustomer = computed(() => this._auth()?.user.principalType === 'customer');
  readonly isAdmin = computed(() => this._auth()?.user.principalType === 'admin');
  readonly accessToken = computed(() => this._auth()?.accessToken ?? null);
  readonly refreshToken = computed(() => this._auth()?.refreshToken ?? null);

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', req).pipe(tap(r => this.persist(r)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', req).pipe(tap(r => this.persist(r)));
  }

  loginAdmin(req: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/admin/login', req).pipe(tap(r => this.persist(r)));
  }

  refresh(): Observable<AuthResponse> {
    const token = this.refreshToken();
    if (!token) throw new Error('No refresh token');
    return this.api.post<AuthResponse>('/auth/refresh', { refreshToken: token }).pipe(tap(r => this.persist(r)));
  }

  logout(): Observable<void> {
    const token = this.refreshToken();
    if (token) {
      return this.api.post<void>('/auth/logout', { refreshToken: token }).pipe(tap(() => this.clear()));
    }
    this.clear();
    return new Observable<void>(s => { s.next(); s.complete(); });
  }

  loginWithGoogle(req: GoogleLoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/google', req).pipe(tap(r => this.persist(r)));
  }

  loginWithFacebook(req: FacebookLoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/facebook', req).pipe(tap(r => this.persist(r)));
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.api.post<void>('/me/change-password', req);
  }

  private persist(r: AuthResponse): void {
    this._auth.set(r);
    this.storage.set(STORAGE_KEY, r);
  }

  clear(): void {
    this._auth.set(null);
    this.storage.remove(STORAGE_KEY);
  }
}
