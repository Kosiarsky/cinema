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
  needOtp = false;
  stagedCredentials: { email: string; password: string } | null = null;
  failedAttempts = this.loadFailedAttempts();
  showCaptcha = this.failedAttempts >= 3;
  captchaQuestion?: string;
  captchaExpected?: number;
  isLocked = false;
  lockSecondsLeft = 0;
  private lockTimer?: any;

  constructor(private authService: AuthService, private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      otp_code: [''],
      captcha: ['']
    });

    if (this.showCaptcha) {
      this.generateCaptcha();
    }
  }

  private enterOtpStep() {
    this.needOtp = true;
    this.stagedCredentials = {
      email: this.loginForm.get('email')!.value,
      password: this.loginForm.get('password')!.value,
    };
    this.errorMessage = 'Wprowadź kod z aplikacji 2FA';
  }

  cancelOtp(): void {
    this.needOtp = false;
    this.errorMessage = null;
    this.stagedCredentials = null;
    this.loginForm.patchValue({ otp_code: '' });
  }

  private loadFailedAttempts(): number {
    try {
      const raw = sessionStorage.getItem('login_failed_attempts');
      const n = raw ? parseInt(raw, 10) : 0;
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  }

  private saveFailedAttempts(n: number) {
    this.failedAttempts = n;
    try { sessionStorage.setItem('login_failed_attempts', String(n)); } catch {}
  }

  private incFailedAttempts() {
    const next = this.failedAttempts + 1;
    this.saveFailedAttempts(next);
    if (next >= 3) {
      this.showCaptcha = true;
      if (!this.captchaQuestion) this.generateCaptcha();
    }
  }

  private resetFailedAttempts() {
    this.saveFailedAttempts(0);
    this.showCaptcha = false;
    this.captchaQuestion = undefined;
    this.captchaExpected = undefined;
    this.loginForm.patchValue({ captcha: '' });
  }

  public generateCaptcha() {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    this.captchaExpected = a + b;
    this.captchaQuestion = `Ile to ${a} + ${b}?`;
    this.loginForm.patchValue({ captcha: '' });
  }

  private startLock(seconds?: number, retryAfter?: string | null) {
    let duration = seconds || 60*15;
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed) && parsed > 0) {
        duration = parsed;
      }
    }
    this.isLocked = true;
    this.lockSecondsLeft = duration;
    if (this.lockTimer) clearInterval(this.lockTimer);
    this.lockTimer = setInterval(() => {
      this.lockSecondsLeft = Math.max(0, this.lockSecondsLeft - 1);
      if (this.lockSecondsLeft <= 0) {
        clearInterval(this.lockTimer);
        this.isLocked = false;
      }
    }, 1000);
  }

  onSubmit(): void {
    if (this.isLocked) return;

    if (this.showCaptcha) {
      const entered = (this.loginForm.get('captcha')!.value || '').toString().trim();
      if (!entered || this.captchaExpected === undefined || parseInt(entered, 10) !== this.captchaExpected) {
        this.errorMessage = 'Rozwiąż poprawnie zadanie zabezpieczające.';
        return;
      }
    }

    if (!this.needOtp && this.loginForm.invalid) return;

    if (!this.needOtp) {
      const payload = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };
      this.authService.login(payload).subscribe({
        next: (response) => {
          if (response?.two_factor_required) {
            this.enterOtpStep();
            return;
          }
          if (!response?.access_token) {
            this.errorMessage = 'Logowanie nie powiodło się!';
            return;
          }
          this.resetFailedAttempts();
          this.authService.saveToken(response.access_token);
          this.authService.saveRefreshToken(response.refresh_token);
          this.authService.saveUser(response.user);
          this.router.navigate(['/']);
        },
        error: (error) => {
          if (error?.status === 429) {
            const retryAfter = error?.headers?.get?.('Retry-After') ?? null;
            this.startLock(undefined, retryAfter);
            return;
          }
          if (error?.status === 401) {
            this.incFailedAttempts();
          }
          this.errorMessage = error?.error?.detail || 'Logowanie nie powiodło się!';
          if (this.showCaptcha) {
            this.generateCaptcha();
          }
        },
      });
    } else {
      const otp = this.loginForm.get('otp_code')!.value;
      if (!otp) {
        this.errorMessage = 'Podaj kod 2FA';
        return;
      }
      const creds = this.stagedCredentials || { email: this.loginForm.get('email')!.value, password: this.loginForm.get('password')!.value };
      const payload: any = { email: creds.email, password: creds.password, otp_code: otp };
      this.authService.login(payload).subscribe({
        next: (response) => {
          if (!response?.access_token) {
            this.errorMessage = 'Logowanie nie powiodło się!';
            return;
          }
          this.resetFailedAttempts();
          this.authService.saveToken(response.access_token);
          this.authService.saveRefreshToken(response.refresh_token);
          this.authService.saveUser(response.user);
          this.router.navigate(['/']);
        },
        error: (error) => {
          if (error?.status === 429) {
            const retryAfter = error?.headers?.get?.('Retry-After') ?? null;
            this.startLock(undefined, retryAfter);
            return;
          }
          if (error?.status === 401) {
            this.incFailedAttempts();
          }
          this.errorMessage = error?.error?.detail || 'Logowanie nie powiodło się!';
          if (this.showCaptcha) {
            this.generateCaptcha();
          }
        },
      });
    }
  }

  onRegister(): void {
    this.router.navigate(['/register']); 
  }
}