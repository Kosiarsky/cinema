import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class ServerService {
  private baseUrl = 'http://localhost:8000/api'; 

  constructor(private http: HttpClient) {}

  getMovies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/movies`);
  }

  getMovieById(movieId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/movies/${movieId}`);
  }

  createMovie(movie: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movie/movies`, movie);
  }

  getSchedulesForMovie(movieId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/movies/${movieId}/schedules`);
  }

  createSchedule(schedule: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movie/schedules`, schedule);
  }

  createActor(actor: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/movie/actors`, actor);
  }

  getTicketPrices(): Observable<any> {
    return this.http.get<any[]>(`${this.baseUrl}/general/ticket-prices`);
  }

  getUserTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/tickets`);
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
}