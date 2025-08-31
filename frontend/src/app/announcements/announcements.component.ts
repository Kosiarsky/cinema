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

  load() {
    this.loading = true; this.error = null;
    this.api.getAnnouncements().subscribe({
      next: (rows) => { this.newsList = rows || []; this.loading = false; },
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