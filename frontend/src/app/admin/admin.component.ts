import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AdminMenuComponent } from './admin-menu/admin-menu.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, AdminMenuComponent],
  templateUrl: './admin.component.html'
})
export class AdminComponent {}
