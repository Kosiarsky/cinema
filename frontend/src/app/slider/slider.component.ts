import { Component, ChangeDetectorRef  } from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, CarouselModule , RouterLink],
  templateUrl: './slider.component.html',
  styles: ``
})
export class SliderComponent {
  slides = [
    {
      image: 'https://img.helios.pl/obrazy/1110x440w/film/oszukac-przeznaczenie-wiezy-krwi/oszukac-przeznaczenie-wiezy-krwi-duzy-obraz-22537.jpg',
      title: 'Oszukać przeznaczenie: Wieże krwi',
      description: 'Film o walce z przeznaczeniem i tajemniczymi wydarzeniami.'
    },
    {
      image: 'https://img.helios.pl/obrazy/1110x440w/film/hurry-up-tomorrow/hurry-up-tomorrow-duzy-obraz-92537.jpg',
      title: 'Hurry Up Tomorrow',
      description: 'Historia pełna emocji i niespodziewanych zwrotów akcji.'
    },
    {
      image: 'https://moviesroom.pl/storage/media/31819/Rami-Malek-o-filmie-Amator.jpg?v=1743947007',
      title: 'Amator',
      description: 'Poruszający dramat o pasji i wytrwałości w dążeniu do celu.'
    }
  ];
  
  carouselOptions = {
    items: 1,
    loop: true,
    margin: 10,
    nav: true,
    dots: true,
    autoWidth: true,
    autoplay: true,
    autoplayTimeout: 15000,
    autoplayHoverPause: true,
    navText: [
      '<i class="fa-solid fa fa-chevron-left fa-xl"></i>',
      '<i class="fa-solid fa fa-chevron-right fa-xl"></i>'
    ],
    responsive: {
      0: { items: 1 },
      600: { items: 1 },
      1000: { items: 1 }
    }
  };

  constructor(private cdr: ChangeDetectorRef) {}
}
