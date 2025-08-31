import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL_TOKEN } from '../shared/tokens';

@Injectable({
    providedIn: 'root'
})

export class ServerService {
  private baseUrl: string;

  constructor(private http: HttpClient, @Inject(API_BASE_URL_TOKEN) apiBase: string) {
    this.baseUrl = `${apiBase}/api`;
  }

  private authHeaders(): { headers?: HttpHeaders } {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
      }
    } catch {}
    return {};
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/movie/categories`);
  }

  createCategory(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/movie/categories`, { name }, this.authHeaders());
  }

  getMovies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/movies`);
  }

  getMovieById(movieId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/movies/${movieId}`);
  }

  createMovie(movie: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movie/movies`, movie, this.authHeaders());
  }

  updateMovie(movieId: number, payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/movie/movies/${movieId}`, payload, this.authHeaders());
  }

  deleteMovie(movieId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/movie/movies/${movieId}`, this.authHeaders());
  }

  getSchedulesForMovie(movieId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/movies/${movieId}/schedules`);
  }

  createSchedule(schedule: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movie/schedules`, schedule, this.authHeaders());
  }

  updateSchedule(scheduleId: number, payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/movie/schedules/${scheduleId}`, payload, this.authHeaders());
  }

  deleteSchedule(scheduleId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/movie/schedules/${scheduleId}`, this.authHeaders());
  }

  createActor(actor: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movie/actors`, actor);
  }

  getTicketPrices(): Observable<any> {
    return this.http.get<any[]>(`${this.baseUrl}/general/ticket-prices`);
  }

  // Slides public
  getSlides(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/general/public/slides`);
  }

  // Slides admin
  adminListSlides(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/slides`, this.authHeaders());
  }
  adminCreateSlide(payload: { title: string; description?: string | null; image: string; movie_id?: number | null; sort_order?: number | null; is_public?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/slides`, payload, this.authHeaders());
  }
  adminUpdateSlide(id: number, payload: { title?: string; description?: string | null; image?: string; movie_id?: number | null; sort_order?: number | null; is_public?: boolean }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/slides/${id}`, payload, this.authHeaders());
  }
  adminDeleteSlide(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/slides/${id}`, this.authHeaders());
  }

  // Announcements (public)
  getAnnouncements(limit?: number): Observable<any[]> {
    let params: HttpParams | undefined = undefined;
    if (limit && limit > 0) {
      params = new HttpParams().set('limit', limit);
    }
    return this.http.get<any[]>(`${this.baseUrl}/general/public/announcements`, { params });
  }

  getUserTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/tickets`, this.authHeaders());
  }

  createTicket(ticket: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/user/tickets`, ticket, this.authHeaders());
  }

  createStripeCheckoutSession(payload: any): Observable<{ id: string; url: string }> {
    return this.http.post<{ id: string; url: string }>(`${this.baseUrl}/payments/create-checkout-session`, payload, this.authHeaders());
  }

  confirmStripePayment(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payments/confirm`, { session_id: sessionId }, this.authHeaders());
  }

  getRepertoire(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/movie/get-schedules`);
  }

  getScheduleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/movie/schedules/${id}`);
  }

  blockSeat(scheduleId: number, row: number, col: number): Observable<{ status: string; expires: string }> {
    return this.http.post<{ status: string; expires: string }>(
      `${this.baseUrl}/movie/schedules/${scheduleId}/block-seat`,
      { row, col }
    );
  }

  releaseSeat(scheduleId: number, row: number, col: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.baseUrl}/movie/schedules/${scheduleId}/release-seat`,
      { row, col }
    );
  }

  releaseSeats(scheduleId: number, seats: Array<[number, number]>): Observable<{ released: number }> {
    return this.http.post<{ released: number }>(
      `${this.baseUrl}/movie/schedules/${scheduleId}/release-seats`,
      seats
    );
  }

  getBlockedSeats(scheduleId: number): Observable<{ blocked_seats: Array<[number, number]> }> {
    return this.http.get<{ blocked_seats: Array<[number, number]> }>(
      `${this.baseUrl}/movie/schedules/${scheduleId}/blocked-seats`
    );
  }

  // Admin stats
  getAdminOverview(days: number = 30, from_date?: string, to_date?: string): Observable<any> {
    let params = new HttpParams().set('days', days);
    if (from_date && to_date) {
      params = params.set('from_date', from_date).set('to_date', to_date);
    }
    return this.http.get<any>(`${this.baseUrl}/admin/stats/overview`, { params, ...(this.authHeaders()) });
  }

  getAdminTopMovies(days: number = 30, limit: number = 5, from_date?: string, to_date?: string): Observable<any[]> {
    let params = new HttpParams().set('days', days).set('limit', limit);
    if (from_date && to_date) {
      params = params.set('from_date', from_date).set('to_date', to_date);
    }
    return this.http.get<any[]>(`${this.baseUrl}/admin/stats/top-movies`, { params, ...(this.authHeaders()) });
  }

  getAdminTopSessions(days: number = 30, limit: number = 5, from_date?: string, to_date?: string): Observable<any[]> {
    let params = new HttpParams().set('days', days).set('limit', limit);
    if (from_date && to_date) {
      params = params.set('from_date', from_date).set('to_date', to_date);
    }
    return this.http.get<any[]>(`${this.baseUrl}/admin/stats/top-sessions`, { params, ...(this.authHeaders()) });
  }

  // Admin users
  adminListUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/users`, this.authHeaders());
  }

  adminUpdateUser(userId: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/admin/users/${userId}`, payload, this.authHeaders());
  }

  adminPromoteUser(userId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/users/${userId}/promote`, {}, this.authHeaders());
  }

  adminDemoteUser(userId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/users/${userId}/demote`, {}, this.authHeaders());
  }

  adminDeleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/users/${userId}`, this.authHeaders());
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/movie/movies/upload-image`, form, this.authHeaders());
  }
}