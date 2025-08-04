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


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent, SettingsComponent, ChangePasswordComponent, TicketsComponent],
  templateUrl: './user-profile.component.html',
  styles: ``
})

export class UserProfileComponent implements OnInit {

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  selectedSection: string = 'tickets';
  user: any = null;
  isLoggedIn: boolean = false;

  ngOnInit(): void {
      this.isLoggedIn = this.authService.isLoggedIn();
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
        return;
      }
      this.user = this.authService.getUser();
  } 
}
