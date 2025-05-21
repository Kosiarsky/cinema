import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-repertoire',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './repertoire.component.html',
  styles: [],
})
export class RepertoireComponent {
  

  days = [
    { date: '2025-05-21', day: 'Poniedziałek' },
    { date: '2025-05-22', day: 'Wtorek' },
    { date: '2025-05-23', day: 'Środa' },
    { date: '2025-05-24', day: 'Czwartek' },
    { date: '2025-05-25', day: 'Piątek' },
  ];

  repertoire = [
    {
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

  getMoviesForDay(date: string) {
    return this.repertoire.filter((movie) => movie.day === date);
  }
}
