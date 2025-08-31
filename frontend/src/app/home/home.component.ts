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
  recommendedMovies = [
    {
      id: 3,
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    },
    {
      id: 1,
      image: 'https://fwcdn.pl/fpo/94/80/10009480/8166856.8.webp',
      title: 'Oszukać przeznaczenie: Wieże krwi',
      description: 'Film o walce z przeznaczeniem i tajemniczymi wydarzeniami.'
    },
    {
      id: 2,
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    },
    {
      id: 3,
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    },
    {
      id: 2,
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    }
  ];

  newsList: any[] = [];
  newsError: string | null = null;

  upcomingMovies: any[] = [];
  loadingAnnouncements = true;
  announcementsError: string | null = null;

  constructor(private api: ServerService) {
    this.loadAnnouncements();
    this.loadNews();
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
      error: () => { /* ignoruj błąd uzupełniania */ }
    });
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}
