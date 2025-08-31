import { Component, ChangeDetectorRef, ChangeDetectionStrategy  } from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toAbs as toAbsHelper } from '../shared/env';
import { ServerService } from '../services/server.service';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, CarouselModule , RouterLink],
  templateUrl: './slider.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderComponent {
  slides: Array<{ id: number; title: string; description?: string | null; image: string; movie_id?: number | null }> = [];
  loading = true;
  fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="32" fill="%23666">Brak obrazu</text></svg>';
  
  carouselOptions = {
    items: 1,
    loop: true,
    margin: 10,
    nav: true,
    dots: true,
    autoWidth: false,
    autoplay: true,
    autoplayTimeout: 15000,
    autoplayHoverPause: true, 
    mouseDrag: false,  
    touchDrag: false,     
    pullDrag: false,        
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

  constructor(private cdr: ChangeDetectorRef, private api: ServerService, private router: Router) {}

  ngOnInit() {
    this.api.getSlides().subscribe({
      next: (rows) => { this.slides = rows || []; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.slides = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img && this.fallback) img.src = this.fallback;
  }

  goTo(movieId?: number | null) {
    if (movieId) this.router.navigate(['/movie', movieId]);
  }
}
