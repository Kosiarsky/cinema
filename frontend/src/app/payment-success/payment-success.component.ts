import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './payment-success.component.html',
  styles: []
})
export class PaymentSuccessComponent implements OnInit {
  status: 'pending' | 'success' | 'error' | 'noSession' = 'pending';
  message = '';
  ticket: any | null = null;
  sessionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ServerService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status = 'pending';
      return;
    }

    this.route.queryParamMap.subscribe(params => {
      const sid = params.get('session_id') || params.get('sessionId');
      this.sessionId = sid;

      if (!sid) {
        this.status = 'noSession';
        this.message = 'Brak identyfikatora sesji płatności.';
        return;
      }

      this.status = 'pending';
      this.message = '';

      this.api.confirmStripePayment(sid).subscribe({
        next: (ticket) => {
          this.ticket = ticket;
          this.status = 'success';
          this.message = 'Płatność potwierdzona. Bilet został utworzony.';
        },
        error: (err) => {
          this.status = 'error';
          const detail = err?.error?.detail || err?.message || 'Nieznany błąd';
          this.message = `Nie udało się potwierdzić płatności: ${detail}`;
        }
      });
    });
  }
}
