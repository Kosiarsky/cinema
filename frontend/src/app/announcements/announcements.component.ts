import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { toAbs as toAbsHelper } from '../shared/env';
import { ServerService } from '../services/server.service';


@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, FooterComponent, RouterLink ],
  templateUrl: './announcements.component.html',
  styles: ``
})

export class AnnouncementsComponent {
  newsList: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private api: ServerService) {
    this.load();
  }

  private pad2(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
  private todayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${this.pad2(now.getMonth() + 1)}-${this.pad2(now.getDate())}`;
  }
  private isFuturePremiere(v: any): boolean {
    if (!v) return false;
    const key = String(v).slice(0, 10);
    return key > this.todayKey();
  }

  load() {
    this.loading = true; this.error = null;
    this.api.getAnnouncements().subscribe({
      next: (rows) => {
        const onlyFuture = (rows || [])
          .filter(r => this.isFuturePremiere(r?.premiere_date))
          .sort((a, b) => String(a?.premiere_date || '').localeCompare(String(b?.premiere_date || '')));
        this.newsList = onlyFuture;
        this.loading = false;
      },
      error: () => { this.error = 'Nie udało się pobrać zapowiedzi'; this.loading = false; }
    });
  }

  getTitle(n: any): string { return n?.title || ''; }
  getImage(n: any): string { return this.toAbs(n?.image || ''); }
  getCast(n: any): string { return n?.cast || ''; }
  getPremiere(n: any): string { return n?.premiere_date || ''; }
  getDuration(n: any): string { return n?.duration || ''; }
  getDescription(n: any): string { return n?.description || ''; }
  getMovieId(n: any): number | null { return n?.id ?? null; }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}