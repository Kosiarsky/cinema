import { Component, Inject, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SliderComponent } from '../slider/slider.component';
import { RouterModule } from '@angular/router';
import { toAbs as toAbsHelper } from '../shared/env';
import { ServerService } from '../services/server.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, FooterComponent, SliderComponent, RouterModule ],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent implements AfterViewInit {
  recommendedMovies: any[] = [];

  newsList: any[] = [];
  newsError: string | null = null;

  upcomingMovies: any[] = [];
  loadingAnnouncements = true;
  announcementsError: string | null = null;

  private isBrowser: boolean;

  constructor(private api: ServerService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) {
      this.loadRecommendedCombined();
    }
    this.loadAnnouncements();
    this.loadNews();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => this.loadRecommendedCombined(), 0);
    }
  }

  private mergeUnique(base: any[], extras: any[], limit: number): any[] {
    const seen = new Set<string | number>();
    for (const it of base) {
      const key = (it && (it.id ?? (it.title + '|' + it.image))) ?? Math.random();
      seen.add(key as any);
    }
    for (const item of extras) {
      const key = (item && (item.id ?? (item.title + '|' + item.image))) ?? Math.random();
      if (!seen.has(key as any)) {
        base.push(item);
        seen.add(key as any);
        if (base.length >= limit) break;
      }
    }
    return base;
  }

  private orderRecommendations(items: any[]): any[] {
    return [...items].sort((a, b) => {
      const ar = (a?.rating ?? -1) as number; 
      const br = (b?.rating ?? -1) as number;
      if (ar !== br) return br - ar; 
      const at = (a?.title ?? '') as string;
      const bt = (b?.title ?? '') as string;
      return at.localeCompare(bt);
    });
  }

  private loadRecommendedCombined(limit: number = 5) {
    const personal$ = this.api.getRecommendations(limit).pipe(catchError(() => of([])));
    const anon$ = this.api.getRecommendationsAnon(limit * 3).pipe(catchError(() => of([])));

    forkJoin([personal$, anon$]).subscribe(([personal, anon]) => {
      const initial = Array.isArray(personal) ? personal : [];
      const filled = this.mergeUnique([...initial], Array.isArray(anon) ? anon : [], limit);
      this.recommendedMovies = this.orderRecommendations(filled).slice(0, limit);
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
