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

  loadMovieById(id: number): void {
    this.isLoading = true;
    this.serverService.getMovieById(id).subscribe({
      next: (result: any) => {
        this.movie = result;
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
    this.groupedSchedules = schedules.reduce((acc, schedule) => {
      if (!acc[schedule.date]) {
        acc[schedule.date] = [];
      }
      acc[schedule.date].push(schedule);
      return acc;
    }, {} as { [date: string]: any[] });
  }

  getScheduleDates(): string[] {
    return Object.keys(this.groupedSchedules);
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
