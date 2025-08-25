import { Component, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { ServerService } from '../services/server.service';

@Component({
  selector: 'app-repertoire',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './repertoire.component.html',
  styles: [],
})
export class RepertoireComponent implements OnInit {
  repertoire: any[] = [];
  isLoading = true;
  days: { id: string, date_numeric: string, date: string, day: string }[] = [];

  constructor(private serverService: ServerService) {}

  ngOnInit(): void {
    this.generateDays();
    this.isLoading = true;
    this.serverService.getRepertoire().subscribe({
      next: (schedules) => {
        this.repertoire = schedules;
        this.isLoading = false;
      },
      error: () => {
        this.repertoire = [];
        this.isLoading = false;
      }
    });
  }

  generateDays() {
    const today = new Date();
    this.days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      this.days.push({
        id: i.toString(),
        date_numeric: formatDate(d, 'yyyy-MM-dd', 'en-US'),
        date: d.toLocaleDateString('pl-PL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        day: d.toLocaleDateString('pl-PL', {
          weekday: 'long',
        }),
      });
    }
  }

  getSchedulesForDay(day: string) {
    return this.repertoire.filter(schedule => schedule.date === day);
  }

  getGroupedSchedulesForDay(day: string) {
    const schedules = this.repertoire.filter(schedule => schedule.date === day);

    const grouped: { movie: any, times: string[], scheduleIds: number[], movieTypes: string[] }[] = [];

    schedules.forEach(schedule => {
      const found = grouped.find(
        g => g.movie.title === schedule.movie.title
      );
      if (found) {
        found.times.push(schedule.time);
        found.scheduleIds.push(schedule.id);
        found.movieTypes.push(schedule.movie_type || 'Napisy');
      } else {
        grouped.push({
          movie: schedule.movie,
          times: [schedule.time],
          scheduleIds: [schedule.id],
          movieTypes: [schedule.movie_type || 'Napisy'],
        });
      }
    });

    grouped.forEach(group => {
      const combined = group.times.map((t, i) => ({ time: t, id: group.scheduleIds[i], type: group.movieTypes[i] }));
      combined.sort((a, b) => a.time.localeCompare(b.time));
      group.times = combined.map(x => x.time);
      group.scheduleIds = combined.map(x => x.id);
      group.movieTypes = combined.map(x => x.type);
    });

    return grouped;
  }
}
