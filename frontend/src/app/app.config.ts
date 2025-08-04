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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
          const authService = inject(AuthService);
          const token = authService.getToken();
          let modifiedReq = req;

          if (token) {
            modifiedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
          }

          return next(modifiedReq).pipe(
            catchError((error: HttpErrorResponse) => {
              const isRefresh = req.url.includes('/refresh-token');
              if (error.status === 401 && !isRefresh) {
                return authService.refreshToken().pipe(
                  switchMap((data: any) => {
                    authService.saveToken(data.access_token);
                    const retryReq = req.clone({
                      setHeaders: {
                        Authorization: `Bearer ${data.access_token}`
                      }
                    });
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