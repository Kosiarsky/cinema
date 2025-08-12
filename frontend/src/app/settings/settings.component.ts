import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styles: ``
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  user: any = null;
  isLoggedIn: Observable<boolean> = of(false);
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}
    
  ngOnInit(): void {
          this.isLoggedIn = this.authService.isLoggedIn();
          if (!this.isLoggedIn) {
            this.router.navigate(['/login']);
            return;
          }
          this.user = this.authService.getUser();

    
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
}