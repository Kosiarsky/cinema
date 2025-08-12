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
        console.log('Repertoire loaded:', this.repertoire);
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

  const grouped: { movie: any, times: string[], scheduleIds: number[] }[] = [];

  schedules.forEach(schedule => {
    const found = grouped.find(
      g => g.movie.title === schedule.movie.title
    );
    if (found) {
      found.times.push(schedule.time);
      found.scheduleIds.push(schedule.id);
    } else {
      grouped.push({
        movie: schedule.movie,
        times: [schedule.time],
        scheduleIds: [schedule.id]
      });
    }
  });

  grouped.forEach(group => {
    group.times.sort((a, b) => a.localeCompare(b));
  });

  return grouped;
}

  repertoire2 = [
    {
      id: 1,
      title: 'Oszukać przeznaczenie: Wieże krwi',
      image: 'https://fwcdn.pl/fpo/94/80/10009480/8166856.8.webp',
      rating: '4.1',
      duration: '1h 45m',
      times: [['14:00', 'Napisy'], ['18:00', 'Napisy'], ['21:00', 'Napisy']],
      day: '2025-05-22',
      type: 'Thriller',
      cast: 'Kaitlyn Santa Juana, Teo Briones',
      description: 'Film opowiada o walce z przeznaczeniem i tajemniczymi wydarzeniami. To pełna emocji historia, która trzyma w napięciu do samego końca.',
    },
    {
      id: 2,
      title: 'Hurry Up Tomorrow',
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      rating: '4.3',
      times: [['14:00', 'Napisy'], ['18:00', 'Napisy'], ['21:00', 'Napisy']],
      day: '2025-05-21',
      type: 'Dramat',
      duration: '1h 55m',
      cast: 'The Weekend, Jenna Ortega, Barry Keoghan',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji. Film, który z pewnością poruszy serca widzów.',
    },
    {
      id: 3,
      title: 'Amator',
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      rating: '4.8',
      times: [['14:00', 'Napisy'], ['18:00', 'Napisy'], ['21:00', 'Napisy']],
      day: '2025-05-21',
      type: 'Dramat',
      duration: '2h 15m',
      cast: 'Rami Malek, Laurence Fishburne',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu. Film, który inspiruje i skłania do refleksji.',
    },
    {
      id: 3,
      title: 'Amator',
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      rating: '4.8',
      times: [['14:00', 'Napisy'], ['18:00', 'Napisy'], ['21:00', 'Napisy']],
      day: '2025-05-23',
      type: 'Dramat',
      duration: '2h 15m',
      cast: 'Rami Malek, Laurence Fishburne',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu. Film, który inspiruje i skłania do refleksji.',
    },
  ];

  
}
