import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './settings.component.html',
  styles: ``
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  passwordForm!: FormGroup;
  user: any = null;
  isLoggedIn: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  passwordSuccessMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.authService.getUser();
    
    this.settingsForm = this.fb.group({
      first_name: [this.user.first_name, Validators.required],
      last_name: [this.user.last_name, Validators.required],
      email: [{ value: this.user.email, disabled: true }, [Validators.required, Validators.email]],
      phone: [this.user.phone, [Validators.pattern('^\\d{9}$')]],
    });

    this.passwordForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/]).{8,}$')
        ]
      ],
      confirm_password: ['', [Validators.required]]
    }, {
       validators: [this.passwordsMatchValidator, this.passwordsNotSameValidator]
    });

  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      const updatedData = {
        ...this.user,
        ...this.settingsForm.getRawValue()
      };
      this.authService.updateUser(updatedData).subscribe({
        next: (user) => {
          this.successMessage = 'Dane zostały zaktualizowane!';
          this.errorMessage = null;
          this.authService.saveUser(user);
        },
        error: () => {
          this.errorMessage = 'Nie udało się zaktualizować danych. Spróbuj ponownie.';
          this.successMessage = null; 
        }
      });
    }
  }

  onPasswordSubmit(): void {
  if (this.passwordForm.valid) {
    const { old_password, new_password } = this.passwordForm.value;
    this.authService.updatePassword(old_password, new_password).subscribe({
      next: () => {
        this.passwordSuccessMessage = 'Hasło zostało zaktualizowane!';
        this.passwordErrorMessage = null;
        this.passwordForm.reset();
      },
      error: (error) => {
        this.passwordErrorMessage = error.error.detail || 'Nie udało się zaktualizować hasła. Spróbuj ponownie.';
        this.passwordSuccessMessage = null; 
      }
    });
  }
}

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('new_password')?.value;
    const confirmPassword = form.get('confirm_password')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  passwordsNotSameValidator(form: FormGroup) {
    const oldPassword = form.get('old_password')?.value;
    const newPassword = form.get('new_password')?.value;
    if (oldPassword && newPassword && oldPassword === newPassword) {
      return { passwordsSame: true };
    }
    return null;
  }
}