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
  styles: [`
    .status { text-align: center; }
    .receipt-card { background:#050A11; border:2px solid #0f1b2f; border-radius: 10px; padding: 16px; }
    .receipt-header { display:flex; align-items:center; justify-content:space-between; gap: 16px; margin-bottom: 12px; }
    .receipt-title { margin:0; }
    .info-line { opacity: .9; }
    .summary-grid { display:grid; grid-template-columns: 1fr; gap:16px; }
    @media (min-width: 992px) { .summary-grid { grid-template-columns: 2fr 1fr; } }
    .summary-table { width:100%; }
    .summary-table th, .summary-table td { padding: 8px; }
    .summary-table thead th { border-bottom: 1px solid rgba(255,255,255,.0); }
    .summary-table tfoot th { border-top: 1px solid rgba(255,255,255,.0); }
    .qr-panel { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background: rgba(255,255,255,0.05); border-radius:10px; padding: 16px; }
    .qr-text { font-size: .9rem; color:#eaeaea; opacity:.9; text-align:center; }
    .actions { margin-top: 16px; display:flex; gap: 12px; justify-content:center; flex-wrap: wrap; }

    @media print {
      .receipt-card { background: #ffffff !important; border-color: #000000 !important; }
      .summary-table.table-dark { color-scheme: light !important; }
      .summary-table,
      .summary-table > :not(caption) > * > * { background: #ffffff !important; background-color: #ffffff !important; color: #000000 !important; }
      .summary-table thead th,
      .summary-table tfoot th,
      .summary-table td,
      .summary-table th { border-color: #000000 !important; }
      .summary-table.table-striped > tbody > tr:nth-of-type(odd) > * { background: #ffffff !important; }
    }
  `]
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
          this.ticket = this.normalizeTicket(ticket);
          this.status = 'success';
          this.message = 'Płatność potwierdzona. Bilet został utworzony.';
          if (!Array.isArray(this.ticket?.seats) || this.ticket.seats.length === 0) {
            this.fetchTicketFromHistory(this.ticket?.id);
          }
        },
        error: (err) => {
          this.status = 'error';
          const detail = err?.error?.detail || err?.message || 'Nieznany błąd';
          this.message = `Nie udało się potwierdzić płatności: ${detail}`;
        }
      });
    });
  }

  private fetchTicketFromHistory(ticketId?: number) {
    if (!ticketId) return;
    this.api.getUserTickets().subscribe({
      next: (list) => {
        const found = (list || []).find((t: any) => t?.id === ticketId);
        if (found) this.ticket = this.normalizeTicket(found);
      }
    });
  }

  private normalizeTicket(t: any) {
    if (!t) return t;
    const seats = Array.isArray(t.seats) ? t.seats : [];
    t.seats = seats.map((s: any) => {
      const rowLabel = s.row_label || s.rowLabel;
      const seatNumber = s.seat_number ?? s.seatNumber;
      const seatTxt = s.seat || (rowLabel && seatNumber != null ? `${rowLabel}-${seatNumber}` : undefined);
      return { ...s, seat: seatTxt };
    });
    return t;
  }

  print(): void {
    if (isPlatformBrowser(this.platformId)) window.print();
  }
}
