import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-menu.component.html'
})
export class AdminMenuComponent {}
