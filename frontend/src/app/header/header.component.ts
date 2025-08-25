import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ CommonModule, RouterLink ],
  templateUrl: './header.component.html',
  styles: ``
})

export class HeaderComponent implements OnInit {
  isLoading = true;
  isLoggedIn = false;
  user: any = null;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.authService.isLoggedIn().subscribe({
      next: (loggedIn) => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.authService.getUser().subscribe({
            next: (user) => {
              this.user = user;
              this.isLoading = false;
            },
            error: () => {
              this.user = null;
              this.isLoading = false;
            }
          });
        } else {
          this.user = null;
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoggedIn = false;
        this.user = null;
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.user = null;
    this.router.navigate(['/login']);
  }
}