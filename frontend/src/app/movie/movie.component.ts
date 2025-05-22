import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './movie.component.html',
  styles: [` `]
})
export class MovieComponent implements OnInit {
  movie: any;
  movies = [
    {
      id: 1,
      title: 'Oszukać przeznaczenie: Wieże krwi',
      image: 'https://fwcdn.pl/fpo/94/80/10009480/8166856.8.webp',
      big_image: 'https://imgur.com/MNMxeoB.jpg',
      trailer: 'https://www.youtube.com/watch?v=e2PsmMlSP5s',
      genre: 'Thriller',
      cast: 'Kaitlyn Santa Juana, Teo Briones',
      duration: '1h 45m',
      rating: '4.1',
      description:
        'Film opowiada o walce z przeznaczeniem i tajemniczymi wydarzeniami. To pełna emocji historia, która trzyma w napięciu do samego końca.',
      schedule: {
        '2025-05-22': ['14:00', '16:30', '19:00', '21:30'],
        '2025-05-23': ['12:00', '15:00', '18:00', '20:30'],
      },
    },
    {
      id: 2,
      title: 'Hurry Up Tomorrow',
      image: 'https://fwcdn.pl/fpo/88/48/10068848/8173706.8.webp',
      big_image: 'https://imgur.com/MNMxeoB.jpg',
      trailer: 'https://www.youtube.com/watch?v=e2PsmMlSP5s',
      genre: 'Dramat',
      cast: 'The Weekend, Jenna Ortega, Barry Keoghan',
      duration: '1h 55m',
      rating: '4.3',
      description:
        'Historia pełna emocji i niespodziewanych zwrotów akcji. Film, który z pewnością poruszy serca widzów.',
      schedule: {
        '2025-05-22': ['12:00', '15:00', '18:00', '21:00'],
        '2025-05-23': ['11:00', '14:00', '17:00', '20:00'],
      },
    },
    {
      id: 3,
      title: 'Amator',
      image: 'https://fwcdn.pl/fpo/15/75/10031575/8171655.8.webp',
      big_image: 'https://imgur.com/MNMxeoB.jpg',
      trailer: 'https://www.youtube.com/watch?v=e2PsmMlSP5s',
      genre: 'Dramat',
      cast: 'Michał Żuraw, Krzysztof Czeczot',
      duration: '2h 10m',
      rating: '4.5',
      description:
        'Poruszający dramat o pasji i wytrwałości w dążeniu do celu. Film, który zainspiruje każdego widza.',
      schedule: {
        '2025-05-22': ['12:00', '15:00', '18:00', '21:00'],
        '2025-05-23': ['11:00', '14:00', '17:00', '20:00'],
      },
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.movie = this.movies.find((movie) => movie.id === id);

    if (!this.movie) {
      this.router.navigate(['/not-found']);
    }
  }

  getScheduleDays(): string[] {
    return Object.keys(this.movie.schedule);
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
