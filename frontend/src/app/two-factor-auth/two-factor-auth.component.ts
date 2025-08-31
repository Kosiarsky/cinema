import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-two-factor-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './two-factor-auth.component.html',
  styles: ``
})
export class TwoFactorAuthComponent implements OnInit {
  twoFAEnabled = false;
  twoFAQr?: string;
  twoFASecret?: string;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.load2FAStatus();
  }

  load2FAStatus() {
    this.authService.twoFAStatus().subscribe({
      next: (s) => { this.twoFAEnabled = !!s?.enabled; },
      error: () => { this.twoFAEnabled = false; }
    });
  }

  start2FASetup() {
    this.authService.twoFASetup().subscribe({
      next: (res) => { this.twoFASecret = res.secret; this.twoFAQr = res.qr_data_url; },
      error: () => {}
    });
  }

  enable2FA(code: string) {
    if (!code) return;
    this.authService.twoFAEnable(code).subscribe({
      next: () => { this.twoFAEnabled = true; },
      error: () => {}
    });
  }

  disable2FA(code?: string) {
    this.authService.twoFADisable(code).subscribe({
      next: () => { this.twoFAEnabled = false; this.twoFAQr = undefined; this.twoFASecret = undefined; },
      error: () => {}
    });
  }
}
