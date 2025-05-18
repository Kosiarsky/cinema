import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
      <router-outlet></router-outlet>
  `,
  styleUrls: [
    '../styles.css'
  ],
})
export class AppComponent {
  title = 'ACinema';
}
