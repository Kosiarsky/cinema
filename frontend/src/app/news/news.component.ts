import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { toAbs as toAbsHelper } from '../shared/env';
import { ServerService } from '../services/server.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './news.component.html',
  styles: ``,
})
export class NewsComponent {
  newsList: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private api: ServerService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.getNews().subscribe({
      next: (rows) => {
        this.newsList = rows || [];
        this.loading = false;
        this.enrichLinkedMovies();
      },
      error: () => {
        this.error = 'Nie udało się pobrać aktualności';
        this.loading = false;
      },
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
