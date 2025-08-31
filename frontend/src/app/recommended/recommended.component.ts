import { Component, OnInit, Inject, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { toAbs as toAbsHelper } from '../shared/env';
import { ServerService } from '../services/server.service';

@Component({
  selector: 'app-recommended',
  standalone: true,
  imports: [ CommonModule, RouterLink, HeaderComponent, FooterComponent ],
  templateUrl: './recommended.component.html',
  styles: ``
})
export class RecommendedComponent implements OnInit, AfterViewInit {
  recommendedList: any[] = [];
  loading = false;
  error: string | null = null;

  private isBrowser: boolean;

  constructor(private api: ServerService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadRecommendations();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => this.loadRecommendations(), 0);
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

  loadRecommendations(limit: number = 12) {
    this.loading = true;
    this.error = null;
    this.api.getRecommendations(limit).subscribe({
      next: (rows) => {
        const initial = rows || [];
        if (initial.length >= limit) {
          this.recommendedList = this.orderRecommendations(initial.slice(0, limit));
          this.loading = false;
          return;
        }
        this.api.getRecommendationsAnon(limit).subscribe({
          next: (alt) => {
            const filled = this.mergeUnique([...initial], alt || [], limit);
            this.recommendedList = this.orderRecommendations(filled);
            this.loading = false;
          },
          error: () => {
            this.recommendedList = this.orderRecommendations(initial);
            this.loading = false;
          }
        });
      },
      error: () => {
        this.api.getRecommendationsAnon(limit).subscribe({
          next: (alt) => {
            this.recommendedList = this.orderRecommendations((alt || []).slice(0, limit));
            this.loading = false;
          },
          error: () => {
            this.error = 'Nie udało się załadować polecanych filmów';
            this.loading = false;
          }
        });
      }
    });
  }

  trackByIdx(index: number) {
    return index;
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}
