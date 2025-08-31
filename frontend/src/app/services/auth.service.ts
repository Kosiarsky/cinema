import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { API_BASE_URL_TOKEN } from '../shared/tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(API_BASE_URL_TOKEN) apiBase: string
  ) {
    this.baseUrl = `${apiBase}/api/user`;
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials, { observe: 'response' }).pipe(
      map((resp) => {
        const body: any = resp.body || {};
        const twofa = resp.headers.get('X-2FA-Required') === '1' || resp.status === 206;
        return { ...body, two_factor_required: twofa };
      }),
      catchError((err: HttpErrorResponse) => {
        const twofa = err.status === 206 || (err.headers && err.headers.get('X-2FA-Required') === '1');
        if (twofa) {
          return of({ two_factor_required: true });
        }
        return throwError(() => err);
      })
    );
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', token); 
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('auth_token'); 
    }
    return null;
  }

  saveRefreshToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('refresh_token', token);
    }
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token'); 
      localStorage.removeItem('refresh_token'); 
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }
    return this.http.get<{ is_logged_in: boolean }>(`${this.baseUrl}/is-logged-in`).pipe(
      map((res) => !!res?.is_logged_in),
      catchError(() => of(false))
    );
  }

  saveUser(user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/me`);
  }

  updateUser(user: any) {
    return this.http.put(`${this.baseUrl}/update`, user);
  }

  updatePassword(oldPassword: string, newPassword: string) {
    return this.http.post(`${this.baseUrl}/change-password`, {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  refreshToken() {
    const refresh_token = this.getRefreshToken();
    return this.http.post<any>(`${this.baseUrl}/refresh-token`, { refresh_token });
  }

  twoFASetup(): Observable<{ secret: string; otpauth_url: string; qr_data_url: string }> {
    return this.http.post<{ secret: string; otpauth_url: string; qr_data_url: string }>(`${this.baseUrl}/2fa/setup`, {});
  }
  twoFAEnable(code: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(`${this.baseUrl}/2fa/enable`, { code });
  }
  twoFADisable(code?: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(`${this.baseUrl}/2fa/disable`, code ? { code } : {});
  }
  twoFAStatus(): Observable<{ enabled: boolean }> {
    return this.http.get<{ enabled: boolean }>(`${this.baseUrl}/2fa/status`);
  }
}