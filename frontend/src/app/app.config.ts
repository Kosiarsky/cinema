import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { API_BASE_URL_TOKEN, FRONTEND_BASE_URL_TOKEN, SSR_AUTH_HEADER_TOKEN } from './shared/tokens';

const resolveApiBase = () =>
  (typeof process !== 'undefined' && (process as any).env && (process as any).env.API_BASE_URL) ||
  (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) ||
  'https://127.0.0.1:8000';

const resolveFrontendBase = () =>
  (typeof process !== 'undefined' && (process as any).env && (process as any).env.FRONTEND_BASE_URL) ||
  (typeof window !== 'undefined' && (window as any).__FRONTEND_BASE_URL__) ||
  'https://localhost:4000';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    { provide: API_BASE_URL_TOKEN, useFactory: resolveApiBase },
    { provide: FRONTEND_BASE_URL_TOKEN, useFactory: resolveFrontendBase },
    { provide: SSR_AUTH_HEADER_TOKEN, useValue: null },
    provideHttpClient(
      withFetch(),
      withInterceptors([
        (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
          const authService = inject(AuthService);
          const ssrAuth = inject(SSR_AUTH_HEADER_TOKEN, { optional: true }) || null;
          const token = authService.getToken();
          const skipAuth = req.headers.has('X-Skip-Auth');
          let modifiedReq = req;

          if (skipAuth) {
            modifiedReq = modifiedReq.clone({ headers: modifiedReq.headers.delete('X-Skip-Auth') });
          }

          if (ssrAuth && !skipAuth) {
            modifiedReq = modifiedReq.clone({ setHeaders: { Authorization: ssrAuth } });
          } else if (token && !skipAuth) {
            modifiedReq = modifiedReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
          }

          return next(modifiedReq).pipe(
            catchError((error: HttpErrorResponse) => {
              const isRefresh = req.url.includes('/refresh-token');
              if (error.status === 401 && !isRefresh) {
                return authService.refreshToken().pipe(
                  switchMap((data: any) => {
                    authService.saveToken(data.access_token);
                    const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${data.access_token}` } });
                    return next(retryReq);
                  }),
                  catchError(refreshError => {
                    authService.logout();
                    return throwError(() => error);
                  })
                );
              }
              
              if (error.status === 401 && isRefresh) {
                authService.logout();
              }
              return throwError(() => error);
            })
          );
        }
      ])
    )
  ]
};