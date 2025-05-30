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
}