import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serverService: ServerService
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
        this.notFound = false;
        this.isLoading = false;
      },
      error: (error: Error)=> {
        this.notFound = true;
        this.isLoading = false;
      }
    });
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
}
