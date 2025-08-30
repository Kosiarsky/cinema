import { Component, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { ServerService } from '../services/server.service';
import { toAbs as toAbsHelper } from '../shared/env';

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
  categories: any[] = [];
  selectedCategoryIds: number[] = [];

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
    this.serverService.getCategories().subscribe({ next: (cats) => this.categories = cats || [] });
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

  toggleCategory(catId: number) {
    const idx = this.selectedCategoryIds.indexOf(catId);
    if (idx >= 0) this.selectedCategoryIds.splice(idx, 1);
    else this.selectedCategoryIds.push(catId);
  }

  clearCategories() {
    this.selectedCategoryIds = [];
  }

  private filterByCategories(schedules: any[]): any[] {
    if (!this.selectedCategoryIds.length) return schedules;
    const sel = new Set(this.selectedCategoryIds);
    return schedules.filter(s => {
      const cats = (s.movie?.categories || []) as Array<{ id: number }>;

      return cats.some(c => sel.has(c.id));
    });
  }

  getSchedulesForDay(day: string) {
    let schedules = this.repertoire.filter(schedule => schedule.date === day);
    schedules = this.filterByCategories(schedules);

    const todayStr = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    if (day === todayStr) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      schedules = schedules.filter(schedule => {
        const time: string = schedule.time || '';
        const [hStr, mStr] = time.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt((mStr ?? '0'), 10);
        if (isNaN(h) || isNaN(m)) {
          return true;
        }
        return (h * 60 + m) >= nowMinutes;
      });
    }

    return schedules;
  }

  getGroupedSchedulesForDay(day: string) {
    let schedules = this.repertoire.filter(schedule => schedule.date === day);

    schedules = this.filterByCategories(schedules);

    const todayStr = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    if (day === todayStr) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      schedules = schedules.filter(schedule => {
        const time: string = schedule.time || '';
        const [hStr, mStr] = time.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt((mStr ?? '0'), 10);
        if (isNaN(h) || isNaN(m)) {
          return true;
        }
        return (h * 60 + m) >= nowMinutes;
      });
    }

    const grouped: { movie: any, times: string[], scheduleIds: number[], movieTypes: string[] }[] = [];

    schedules.forEach(schedule => {
      const found = grouped.find(g => g.movie.title === schedule.movie.title);
      if (found) {
        found.times.push(schedule.time);
        found.scheduleIds.push(schedule.id);
        found.movieTypes.push(schedule.movie_type || 'Napisy');
      } else {
        grouped.push({
          movie: schedule.movie,
          times: [schedule.time],
          scheduleIds: [schedule.id],
          movieTypes: [schedule.movie_type || 'Napisy']
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

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }
}
