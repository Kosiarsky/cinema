import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SliderComponent } from '../slider/slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, FooterComponent, SliderComponent ],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {
  recommendedMovies = [
    {
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    },
    {
      image: 'https://fwcdn.pl/fpo/94/80/10009480/8166856.8.webp',
      title: 'Oszukać przeznaczenie: Wieże krwi',
      description: 'Film o walce z przeznaczeniem i tajemniczymi wydarzeniami.'
    },
    {
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    },
    {
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    },
    {
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    }
  ];

  newsList = [
    { title: 'Oszukać przeznaczenie: Więzy krwi nadchodzi!', summary: 'Najnowsza odsłona krwawego i kasowego cyklu studia New Line Cinema, zabiera widzów do samych początków tego, jak śmierć zaczęła realizować swoje obłąkane poczucie sprawiedliwości. Prześladowana strasznym, powtarzającym się koszmarem studentka Stefanie wraca do rodzinnego miasta. Chce odnaleźć jedyną osobę, która może przerwać błędne koło i ocalić członków jej rodziny przed niechybnie czekającą ich makabryczną śmiercią…' },
    { title: 'News 2', summary: 'Summary of News 2' },
    { title: 'News 3', summary: 'Summary of News 3' },
  ];

  upcomingMovies = [
    {
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    },
    {
      image: 'https://fwcdn.pl/fpo/94/80/10009480/8166856.8.webp',
      title: 'Oszukać przeznaczenie: Wieże krwi',
      description: 'Film o walce z przeznaczeniem i tajemniczymi wydarzeniami.'
    },
    {
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    },
    {
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    },
    {
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    }
  ];
}
