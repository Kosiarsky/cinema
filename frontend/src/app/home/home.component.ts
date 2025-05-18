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
    { title: 'Recommended Movie 1', description: 'Description of Recommended Movie 1' },
    { title: 'Recommended Movie 2', description: 'Description of Recommended Movie 2' },
    { title: 'Recommended Movie 3', description: 'Description of Recommended Movie 3' },
    { title: 'Recommended Movie 4', description: 'Description of Recommended Movie 4' },
  ];

  newsList = [
    { title: 'News 1', summary: 'Summary of News 1' },
    { title: 'News 2', summary: 'Summary of News 2' },
    { title: 'News 3', summary: 'Summary of News 3' },
  ];

  upcomingMovies = [
    { title: 'Upcoming Movie 1', description: 'Description of Upcoming Movie 1' },
    { title: 'Upcoming Movie 2', description: 'Description of Upcoming Movie 2' },
    { title: 'Upcoming Movie 3', description: 'Description of Upcoming Movie 3' },
    { title: 'Upcoming Movie 4', description: 'Description of Upcoming Movie 4' },
  ];
}
