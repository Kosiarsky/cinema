import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  template: `
      <router-outlet></router-outlet>
  `,
  styleUrls: [
    '../styles.css'
  ],
})
export class AppComponent {
  title = 'Apollo';
}
