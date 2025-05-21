import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './news.component.html',
  styles: ``,
})
export class NewsComponent {
  newsList = [
    {
      title: 'Oszukać przeznaczenie: Wieże krwi',
      image: 'https://fwcdn.pl/fpo/94/80/10009480/8166856.8.webp',
      date: '2025-05-01',
      content:
        'Film opowiada o walce z przeznaczeniem i tajemniczymi wydarzeniami. To pełna emocji historia, która trzyma w napięciu do samego końca.',
    },
    {
      title: 'Hurry Up Tomorrow',
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      date: '2025-04-25',
      content:
        'Historia pełna emocji i niespodziewanych zwrotów akcji. Film, który z pewnością poruszy serca widzów.',
    },
    {
      title: 'Amator',
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      date: '2025-04-20',
      content:
        'Poruszający dramat o pasji i wytrwałości w dążeniu do celu. Film, który inspiruje i skłania do refleksji.',
    },
  ];
}
