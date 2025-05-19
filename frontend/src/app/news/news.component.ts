import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [ CommonModule, RouterLink ],
  templateUrl: './news.component.html',
  styles: ``
})
export class NewsComponent {

}
