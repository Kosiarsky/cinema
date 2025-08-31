import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SliderComponent } from '../slider/slider.component';
import { RouterModule } from '@angular/router';
import { toAbs as toAbsHelper } from '../shared/env';
import { ServerService } from '../services/server.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, FooterComponent, SliderComponent, RouterModule ],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {
  recommendedMovies: any[] = [];

  newsList: any[] = [];
  newsError: string | null = null;

  upcomingMovies: any[] = [];
  loadingAnnouncements = true;
  announcementsError: string | null = null;

  constructor(private api: ServerService) {
    this.loadRecommended();
    this.loadAnnouncements();
    this.loadNews();
  }

  private loadRecommended() {
    const limit = 5; 
    this.api.getRecommendations(limit).subscribe({
      next: (rows) => {
        if (!rows || rows.length === 0) {
          this.api.getRecommendationsAnon(limit).subscribe({
            next: (alt) => { this.recommendedMovies = alt || []; },
            error: () => { this.recommendedMovies = []; }
          });
          return;
        }
        this.recommendedMovies = rows || [];
      },
      error: () => {
        this.api.getRecommendationsAnon(limit).subscribe({
          next: (alt) => { this.recommendedMovies = alt || []; },
          error: () => { this.recommendedMovies = []; }
        });
      }
    });
  }

  private loadAnnouncements() {
    this.loadingAnnouncements = true; this.announcementsError = null;
    this.api.getAnnouncements(6).subscribe({
      next: (rows) => { this.upcomingMovies = (rows || []).map(r => ({ id: r.id, image: r.image, title: r.title, description: r.description, premiere_date: r.premiere_date })); this.loadingAnnouncements = false; },
      error: () => { this.announcementsError = 'Nie udało się pobrać zapowiedzi'; this.loadingAnnouncements = false; }
    });
  }

  private loadNews() {
    this.newsError = null;
    this.api.getNews(3).subscribe({
      next: (rows) => { this.newsList = rows || []; this.enrichLinkedMovies(); },
      error: () => { this.newsError = 'Nie udało się pobrać aktualności'; }
    });
  }

  private enrichLinkedMovies() {
    const needs = (this.newsList || [])
      .map((n, i) => ({ n, i }))
      .filter(x => !!x.n?.movie_id && !x.n?.movie);
    if (!needs.length) return;

    forkJoin(needs.map(x => this.api.getMovieById(x.n.movie_id))).subscribe({
      next: (movies) => {
        movies.forEach((movie, idx) => {
          const i = needs[idx].i;
          this.newsList[i] = { ...this.newsList[i], movie };
        });
      },
      error: () => {}
    });
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}
