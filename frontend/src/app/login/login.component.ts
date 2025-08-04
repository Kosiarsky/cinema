import { Component } from '@angular/core';
import { ReactiveFormsModule,FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './login.component.html',
  styles: ``,
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
  if (this.loginForm.valid) {
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.authService.saveToken(response.access_token);
        this.authService.saveRefreshToken(response.refresh_token);
        this.authService.saveUser(response.user); 
        this.router.navigate(['/']); 
      },
      error: (error) => {
        this.errorMessage = error.error.detail || 'Logowanie nie powiodło się!';
      },
    });
  }
}

  onRegister(): void {
    this.router.navigate(['/register']); 
  }
}