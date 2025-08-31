import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';
import { toAbs as toAbsHelper } from '../shared/env';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './news-detail.component.html'
})
export class NewsDetailComponent {
  item: any | null = null;
  movie: any | null = null;
  loading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private api: ServerService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'Nieprawidłowe ID'; this.loading = false; return; }
    this.api.getNewsById(id).subscribe({
      next: (row) => {
        this.item = row;
        if (row?.movie_id) {
          this.api.getMovieById(row.movie_id).subscribe({
            next: (m) => { this.movie = m; this.loading = false; },
            error: () => { this.loading = false; }
          });
        } else {
          this.loading = false;
        }
      },
      error: () => { this.error = 'Nie znaleziono aktualności'; this.loading = false; }
    });
  }

  heroImage(): string | null {
    const url = this.item?.image || this.movie?.big_image || this.movie?.image;
    const abs = this.toAbs(url || undefined);
    return abs || null;
  }

  toAbs(url?: string): string { return (toAbsHelper(url) || '') as string; }
}
