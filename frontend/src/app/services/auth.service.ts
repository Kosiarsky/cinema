import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:8000/api/user';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
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
}