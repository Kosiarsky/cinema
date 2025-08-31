import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class RecommendedComponent implements OnInit {
  recommendedList: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(limit: number = 12) {
    this.loading = true;
    this.error = null;
    this.api.getRecommendations(limit).subscribe({
      next: (rows) => {
        if (!rows || rows.length === 0) {
          this.api.getRecommendationsAnon(limit).subscribe({
            next: (alt) => {
              this.recommendedList = alt || [];
              this.loading = false;
            },
            error: (e2) => {
              console.error('Failed to load anonymous recommendations', e2);
              this.error = 'Nie udało się załadować polecanych filmów';
              this.loading = false;
            }
          });
          return;
        }
        this.recommendedList = rows || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load recommendations', err);
        this.api.getRecommendationsAnon(limit).subscribe({
          next: (alt) => {
            this.recommendedList = alt || [];
            this.loading = false;
          },
          error: (e2) => {
            console.error('Failed to load anonymous recommendations', e2);
            this.error = 'Nie udało się załadować polecanych filmów';
            this.loading = false;
          }
        });
      }
    });
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}
