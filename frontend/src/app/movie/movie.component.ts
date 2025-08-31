import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';
import { toAbs as toAbsHelper } from '../shared/env';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './movie.component.html',
  styles: [` `]
})
export class MovieComponent implements OnInit {
  movie: any; 
  groupedSchedules: { [date: string]: any[] } = {};
  isLoading = true;
  notFound = false;
  trailerUrl: SafeResourceUrl | null = null;
  // Whether movie premiere date is in the future (hide schedules if true)
  isBeforePremiere = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serverService: ServerService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMovieById(id);
  }

  // Helpers for date/time handling
  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  private addDays(d: Date, days: number): Date {
    const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  private timeToMin(hhmm: string | undefined | null): number {
    if (!hhmm) return Number.NaN;
    const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(hhmm);
    if (!m) return Number.NaN;
    const h = parseInt(m[1], 10);
    const mi = parseInt(m[2], 10);
    if (isNaN(h) || isNaN(mi)) return Number.NaN;
    return h * 60 + mi;
  }
  private normalizeDateStr(dateStr: string): string {
    // Keep only YYYY-MM-DD portion if a datetime is provided
    const s = dateStr.trim();
    return s.length >= 10 ? s.substring(0, 10) : s;
  }
  // Checks if a date string (YYYY-MM-DD or ISO datetime) is in the future relative to today
  private isDateInFuture(dateStr?: string | null): boolean {
    if (!dateStr) return false;
    const todayISO = this.toISO(new Date());
    const onlyDate = this.normalizeDateStr(dateStr);
    return onlyDate > todayISO; // strict: only dates after today are considered future
  }

  loadMovieById(id: number): void {
    this.isLoading = true;
    this.serverService.getMovieById(id).subscribe({
      next: (result: any) => {
        this.movie = result;
        // Determine if movie is before its premiere date
        this.isBeforePremiere = this.isDateInFuture(this.movie?.premiere_date);
        this.groupSchedulesByDate(result.schedules);
        this.trailerUrl = this.buildTrailerUrl(result?.trailer);
        this.notFound = false;
        this.isLoading = false;
      },
      error: (error: Error)=> {
        this.notFound = true;
        this.isLoading = false;
      }
    });
  }

  private buildTrailerUrl(raw?: string): SafeResourceUrl | null {
    const id = this.extractYouTubeId(raw || '');
    if (!id) return null;
    const embed = `https://www.youtube.com/embed/${id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  private extractYouTubeId(url: string): string | null {
    if (!url) return null;
    try {
      // Support youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>, plus additional params
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        const p = u.pathname.split('/').filter(Boolean);
        return p[0] || null;
      }
      if (u.searchParams.has('v')) {
        return u.searchParams.get('v');
      }
      const path = u.pathname.split('/').filter(Boolean);
      const embedIdx = path.indexOf('embed');
      if (embedIdx >= 0 && path[embedIdx + 1]) {
        return path[embedIdx + 1];
      }
      // Shorts format: /shorts/<id>
      const shortsIdx = path.indexOf('shorts');
      if (shortsIdx >= 0 && path[shortsIdx + 1]) {
        return path[shortsIdx + 1];
      }
    } catch {}
    return null;
  }

  groupSchedulesByDate(schedules: any[]): void {
    const now = new Date();
    const todayISO = this.toISO(now);
    const endISO = this.toISO(this.addDays(now, 6)); // today + 6 days = 7 days total
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const grouped: { [date: string]: any[] } = {};
    for (const s of (schedules || [])) {
      const date: string = s?.date;
      if (!date) continue;
      // Limit to [today .. today+6]
      if (date < todayISO || date > endISO) continue;
      // For today, hide past times
      if (date === todayISO) {
        const tmin = this.timeToMin(s?.time);
        if (isNaN(tmin) || tmin < nowMin) continue;
      }
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(s);
    }

    // Sort times within each date and drop empty dates (just in case)
    for (const d of Object.keys(grouped)) {
      grouped[d].sort((a, b) => this.timeToMin(a?.time) - this.timeToMin(b?.time));
      if (!grouped[d].length) delete grouped[d];
    }

    this.groupedSchedules = grouped;
  }

  getScheduleDates(): string[] {
    return Object.keys(this.groupedSchedules).sort();
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}
