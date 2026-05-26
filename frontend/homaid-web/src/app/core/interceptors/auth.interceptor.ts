import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshing$ = new BehaviorSubject<string | null>(null);
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const noAuthPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/admin/login', '/auth/google', '/auth/facebook'];
  const isNoAuth = noAuthPaths.some(p => req.url.includes(p));

  const authed = token && !isNoAuth ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isNoAuth && auth.refreshToken()) {
        return handle401(req, next, auth);
      }
      return throwError(() => err);
    })
  );
};

function handle401(req: any, next: any, auth: AuthService): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshing$ = new BehaviorSubject<string | null>(null);

    return auth.refresh().pipe(
      switchMap(r => {
        isRefreshing = false;
        refreshing$.next(r.accessToken);
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${r.accessToken}` } }));
      }),
      catchError(e => {
        isRefreshing = false;
        auth.clear();
        return throwError(() => e);
      })
    );
  }

  return refreshing$.pipe(
    filter(t => t !== null),
    take(1),
    switchMap(t => next(req.clone({ setHeaders: { Authorization: `Bearer ${t!}` } })))
  );
}
