import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styles: ``
})
export class ChangePasswordComponent implements OnInit {
  
  passwordForm!: FormGroup;
  passwordSuccessMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
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
