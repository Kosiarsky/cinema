import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './register.component.html',
  styles: ``,
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [
        Validators.required,
        Validators.pattern('^\\d{9}$') 
      ]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/]).{8,}$')
        ]
      ],
      confirmPassword: ['', [Validators.required]],
    }, {
       validators: this.passwordsMatchValidator 
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { confirmPassword, ...userData } = this.registerForm.value;
      if (userData.password !== confirmPassword) {
        this.errorMessage = 'Hasła nie są zgodne';
        return;
      }

      const payload = {
        email: this.registerForm.value.email,
        first_name: this.registerForm.value.firstName,
        last_name: this.registerForm.value.lastName,
        phone: this.registerForm.value.phone,
        password: this.registerForm.value.password,
        is_admin: 0
      };
      this.authService.register(payload).subscribe({
        next: () => {
          this.router.navigate(['/login']); 
        },
        error: (error) => {
          this.errorMessage = error.error.detail || 'Rejestracja nie powiodła się!';
        },
      });
    }
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}