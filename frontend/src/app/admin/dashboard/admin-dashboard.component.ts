import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServerService } from '../../services/server.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  overview: any;
  topMovies: any[] = [];
  topSessions: any[] = [];

  selectedPeriod = 14; 
  fromDate: string | undefined;
  toDate: string | undefined;
  topLimit = 5;

  @ViewChild('revCanvas') revCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tickCanvas') tickCanvas!: ElementRef<HTMLCanvasElement>;

  private revChart?: Chart;
  private tickChart?: Chart;
  private viewReady = false;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  setPeriod(days: number) {
    this.selectedPeriod = days;
    this.fromDate = undefined;
    this.toDate = undefined;
    this.loadAll();
  }

  applyCustomRange() {
    if (this.fromDate && this.toDate) {
      this.loadAll();
    }
  }

  clearCustomRange() {
    this.fromDate = undefined;
    this.toDate = undefined;
    this.selectedPeriod = 30;
    this.loadAll();
  }

  loadAll() {
    this.api.getAdminOverview(this.selectedPeriod, this.fromDate, this.toDate)
      .subscribe({ next: (d) => { this.overview = d; this.renderCharts(); } });
    this.loadTop();
  }

  loadTop() {
    this.api.getAdminTopMovies(this.selectedPeriod, this.topLimit, this.fromDate, this.toDate)
      .subscribe({ next: (d) => this.topMovies = d || [] });
    this.api.getAdminTopSessions(this.selectedPeriod, this.topLimit, this.fromDate, this.toDate)
      .subscribe({ next: (d) => this.topSessions = d || [] });
  }

  averageTicketPrice(): number {
    if (!this.overview || !this.overview.total_tickets) return 0;
    return (this.overview.total_revenue || 0) / this.overview.total_tickets;
  }

  private renderCharts() {
    if (!this.viewReady || !this.overview?.last_days) return;
    const labels = this.overview.last_days.map((x: any) => x.date);
    const revenue = this.overview.last_days.map((x: any) => x.revenue);
    const tickets = this.overview.last_days.map((x: any) => x.tickets);

    if (this.revCanvas?.nativeElement) {
      this.revChart?.destroy();
      this.revChart = new Chart(this.revCanvas.nativeElement.getContext('2d')!, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Przychód (zł)',
              data: revenue,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13,110,253,0.15)',
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#ddd' } } },
          scales: {
            x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
            y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          },
        },
      });
    }

    if (this.tickCanvas?.nativeElement) {
      this.tickChart?.destroy();
      this.tickChart = new Chart(this.tickCanvas.nativeElement.getContext('2d')!, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Bilety (szt.)',
              data: tickets,
              borderColor: '#20c997',
              backgroundColor: 'rgba(32,201,151,0.35)',
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#ddd' } } },
          scales: {
            x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
            y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          },
        },
      });
    }
  }

  private destroyCharts() {
    this.revChart?.destroy();
    this.tickChart?.destroy();
    this.revChart = undefined;
    this.tickChart = undefined;
  }

  exportOverviewCSV30() {
    this.api.getAdminOverview(30).subscribe({
      next: (d) => {
        const rows = d?.last_days || [];
        const header = ['date','revenue','tickets','orders'];
        const csv = [header.join(',')]
          .concat(rows.map((r: any) => [r.date, r.revenue, r.tickets, r.orders].join(',')))
          .join('\n');
        this.downloadCSV(csv, `overview_last_30_days.csv`);
      }
    });
  }

  exportTopMoviesCSV() {
    const header = ['movie_id','title','tickets_sold','revenue'];
    const csv = [header.join(',')]
      .concat((this.topMovies||[]).map((m: any) => [m.movie_id, this.escapeCsv(m.title), m.tickets_sold, m.revenue].join(',')))
      .join('\n');
    this.downloadCSV(csv, `top_movies.csv`);
  }

  private escapeCsv(val: string): string {
    if (val == null) return '';
    const s = String(val);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  get lastDaysDesc() {
    return (this.overview?.last_days ?? []).slice().reverse();
  }
}
