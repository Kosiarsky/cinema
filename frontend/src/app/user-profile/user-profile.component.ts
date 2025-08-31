import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SettingsComponent } from '../settings/settings.component';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { TicketsComponent } from '../tickets/tickets.component';
import { TicketsHistoryComponent } from '../tickets-history/tickets-history.component';
import { TwoFactorAuthComponent } from '../two-factor-auth/two-factor-auth.component';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent, SettingsComponent, ChangePasswordComponent, TicketsComponent, TicketsHistoryComponent, TwoFactorAuthComponent],
  templateUrl: './user-profile.component.html',
  styles: ``
})

export class UserProfileComponent implements OnInit {

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  selectedSection: string = 'tickets';
  user: any = null;
  isLoggedIn: boolean = false;

  ngOnInit(): void {
      this.authService.isLoggedIn().subscribe({
        next: (loggedIn) => {
          this.isLoggedIn = loggedIn;
          if (!loggedIn) {
            this.router.navigate(['/login']);
            return;
          }
          this.authService.getUser().subscribe({
            next: (user) => { this.user = user; },
            error: () => { this.user = null; }
          });
        },
        error: () => {
          this.isLoggedIn = false;
          this.router.navigate(['/login']);
        }
      });
  } 
}
