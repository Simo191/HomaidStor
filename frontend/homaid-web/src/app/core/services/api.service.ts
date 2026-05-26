import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiError, ApiResponse } from '../models/api.models';

export class ApiException extends Error {
  constructor(public code: string, message: string, public status = 0) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.get<ApiResponse<T> | T>(this.url(path), { params: this.buildParams(params) }).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(this.handleError)
    );
  }

  post<T>(path: string, body: unknown, params?: Record<string, unknown>): Observable<T> {
    return this.http.post<ApiResponse<T> | T>(this.url(path), body, { params: this.buildParams(params) }).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(this.handleError)
    );
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<ApiResponse<T> | T>(this.url(path), body).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(this.handleError)
    );
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<ApiResponse<T> | T>(this.url(path), body).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(this.handleError)
    );
  }

  delete<T = void>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.delete<ApiResponse<T> | T>(this.url(path), { params: this.buildParams(params) }).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(this.handleError)
    );
  }

  private url(path: string): string {
    return path.startsWith('http') ? path : `${this.base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private buildParams(obj?: Record<string, unknown>): HttpParams | undefined {
    if (!obj) return undefined;
    let params = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') return;
      params = params.set(k, String(v));
    });
    return params;
  }

  private unwrap<T>(r: ApiResponse<T> | T): T {
    if (r && typeof r === 'object' && 'success' in (r as object)) {
      const env = r as ApiResponse<T>;
      if (!env.success || env.error) {
        const err = env.error as ApiError;
        throw new ApiException(err.code, err.message);
      }
      return env.data as T;
    }
    return r as T;
  }

  private handleError = (err: unknown): Observable<never> => {
    if (err instanceof ApiException) return throwError(() => err);
    const httpErr = err as { status?: number; error?: { error?: ApiError; errors?: Record<string, string[]> } };
    if (httpErr?.error?.error) {
      const e = httpErr.error.error;
      return throwError(() => new ApiException(e.code, e.message, httpErr.status ?? 0));
    }
    if (httpErr?.error?.errors) {
      const first = Object.values(httpErr.error.errors)[0]?.[0];
      return throwError(() => new ApiException('validation', first ?? 'Validation failed', httpErr.status ?? 400));
    }
    return throwError(() => new ApiException('network', 'Erreur réseau ou serveur indisponible.', httpErr?.status ?? 0));
  };
}
