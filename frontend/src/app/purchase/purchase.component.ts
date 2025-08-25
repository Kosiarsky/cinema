import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './purchase.component.html',
  styles: [` 
    .screen { width: 100%; text-transform: uppercase; text-align: center; margin: 16px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
    .seat-layout { display:flex; gap:16px; justify-content:center; align-items:flex-start; }
    .seat-grid { display: grid; gap: 6px; justify-content: center; }
    .row { display: flex; gap: 6px; justify-content: center; margin-bottom: 4px; align-items:center; }
    .row-label { width: 36px; text-align: right; margin-right: 6px; opacity: 0.85; font-weight: 600; }
    .seat { width: 28px; height: 28px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size: 12px; cursor: pointer; user-select: none; }
    .seat2 { background:rgb(54, 54, 54); width: 45px; height: 28px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size: 12px; cursor: pointer; user-select: none; }
    .seat.available { background: #2d6a4f; }
    .seat.blocked { background: #9e2a2b; cursor:not-allowed; }
    .seat.selected { background: #1d3557; }
    .legend { display:flex; gap:12px; justify-content:center; margin: 8px 0 16px; }
    .legend .box { width: 16px; height: 16px; border-radius: 4px; display:inline-block; margin-right:6px; }
    .exit-indicator { max-height: 100px; color: #ddd; background: rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 6px; font-size: 12px; letter-spacing: 1px; writing-mode: vertical-rl; text-orientation: mixed; align-self: stretch; display:flex; align-items:center; justify-content:center; }
  `]
})
export class PurchaseComponent implements OnInit, OnDestroy {
  schedule: any;
  isLoading = true;

  seatMatrix: boolean[][] = []; 
  blockedSeats = new Set<string>();
  selectedSeats = new Set<string>();
  maxSeats = 10;
  holdExpiresAt?: Date; 
  private seatRefreshTimer?: any;
  private holdTimer?: any;
  holdCountdown = '';
  private isBrowser: boolean;
  maxSeatsMessage: string | null = null;
  sessionExpired = false;
  missingHall = false;

  checkoutMode = false;
  ticketPrices: any[] = [];
  checkoutItems: Array<{ row: number; col: number; rowLabel: string; seatNumber: number; type: string; price: number }> = [];
  totalPrice = 0;
  paymentError: string | null = null;
  isPaying = false;
  paymentCanceled = false;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const canceled = this.route.snapshot.queryParamMap.get('canceled');
    this.paymentCanceled = canceled === '1';

    this.serverService.getScheduleById(id).subscribe({
      next: (schedule) => {
        this.schedule = schedule;
        this.missingHall = !schedule?.hall;
        if (Array.isArray(schedule?.seats) && schedule.seats.length) {
          this.seatMatrix = schedule.seats;
        } else {
          const rows = 10, cols = 20;
          this.seatMatrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));
        }
        this.isLoading = false;
        if (this.isBrowser) {
          this.refreshBlockedSeats();
          this.seatRefreshTimer = setInterval(() => this.refreshBlockedSeats(), 20000);
        }
      },
      error: () => {
        this.schedule = null;
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.seatRefreshTimer) clearInterval(this.seatRefreshTimer);
    if (this.holdTimer) clearInterval(this.holdTimer);
  }

  private key(r: number, c: number) { return `${r}-${c}`; }

  rowLabel(index: number): string {
    if (index < 0) return '';
    let label = '';
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }
    return label;
  }

  isSeatBlocked(r: number, c: number) {
    return this.blockedSeats.has(this.key(r,c));
  }

  isSeatAvailable(r: number, c: number) {
    const withinMatrix = this.seatMatrix?.[r]?.[c] === true;
    return withinMatrix && !this.isSeatBlocked(r,c);
  }

  toggleSeat(r: number, c: number) {
    if (!this.isSeatAvailable(r,c) && !this.selectedSeats.has(this.key(r,c))) return;
    const k = this.key(r,c);
    if (this.selectedSeats.has(k)) {
      this.selectedSeats.delete(k);
      this.maxSeatsMessage = null;
      if (this.isBrowser) {
        const scheduleId = Number(this.route.snapshot.paramMap.get('id'));
        this.serverService.releaseSeat(scheduleId, r, c).subscribe({
          next: () => this.refreshBlockedSeats(),
          error: () => this.refreshBlockedSeats()
        });
      }
      return;
    }
    if (this.selectedSeats.size >= this.maxSeats) {
      this.maxSeatsMessage = `Możesz wybrać maksymalnie ${this.maxSeats} miejsc.`;
      return;
    }
    this.maxSeatsMessage = null;
    this.sessionExpired = false;
    this.selectedSeats.add(k);
    if (this.isBrowser) {
      this.blockSeatOnServer(r, c);
    }
  }

  private blockSeatOnServer(r: number, c: number) {
    const scheduleId = Number(this.route.snapshot.paramMap.get('id'));
    this.serverService.blockSeat(scheduleId, r, c).subscribe({
      next: (res) => {
        if (res?.expires) {
          const parsed = this.parseExpiryUtc(res.expires);
          if (parsed) {
            this.holdExpiresAt = parsed;
            this.sessionExpired = false;
            if (this.isBrowser) this.startHoldTimer();
          }
        }
        this.refreshBlockedSeats();
      },
      error: () => {
        this.refreshBlockedSeats();
      }
    });
  }

  private parseExpiryUtc(expires: string): Date | undefined {
    try {
      if (!expires) return undefined;
      let s = String(expires).trim();

      s = s.replace(' ', 'T');

      s = s.replace(/\.(\d{3})\d+/, '.$1');
      const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(s);
      if (!hasTZ) s = `${s}Z`;
      const d = new Date(s);
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }

  private startHoldTimer() {
    if (!this.isBrowser) return;
    if (this.holdTimer) clearInterval(this.holdTimer);
    const update = () => {
      if (!this.holdExpiresAt) { this.holdCountdown = ''; return; }
      const ms = this.holdExpiresAt.getTime() - Date.now();
      if (ms <= 0) {
        this.holdCountdown = '';
        this.holdExpiresAt = undefined;
        const scheduleId = Number(this.route.snapshot.paramMap.get('id'));
        const seats: Array<[number, number]> = Array.from(this.selectedSeats).map(k => {
          const [r, c] = k.split('-').map(Number);
          return [r, c];
        });
        this.selectedSeats.clear();
        this.sessionExpired = true;
        this.checkoutMode = false;
        this.checkoutItems = [];
        this.totalPrice = 0;
        if (this.isBrowser && seats.length) {
          this.serverService.releaseSeats(scheduleId, seats).subscribe({
            next: () => this.refreshBlockedSeats(),
            error: () => this.refreshBlockedSeats()
          });
        } else {
          this.refreshBlockedSeats();
        }
        clearInterval(this.holdTimer);
        this.holdTimer = undefined;
        return;
      }
      const totalSec = Math.floor(ms / 1000);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      this.holdCountdown = `${mm}:${ss}`;
    };
    update();
    this.holdTimer = setInterval(update, 1000);
  }

  refreshBlockedSeats() {
    if (!this.isBrowser) return;
    const scheduleId = Number(this.route.snapshot.paramMap.get('id'));
    if (!scheduleId) return;
    this.serverService.getBlockedSeats(scheduleId).subscribe({
      next: (res) => {
        const set = new Set<string>();
        (res?.blocked_seats || []).forEach(([r, c]) => set.add(this.key(r, c)));
        this.blockedSeats = set;
      }
    });
  }

  get selectedCount() { return this.selectedSeats.size; }

  proceedToPayment() {
    if (this.selectedSeats.size === 0 || this.sessionExpired) return;
    if (this.missingHall || !this.schedule?.hall) {
      this.paymentError = 'Tego seansu nie można zarezerwować ani opłacić, ponieważ nie ma przypisanej sali.';
      return;
    }
    this.paymentError = null;

    const items = Array.from(this.selectedSeats)
      .map(k => k.split('-').map(Number) as [number, number])
      .sort((a,b) => a[0] - b[0] || a[1] - b[1])
      .map(([r,c]) => ({
        row: r,
        col: c,
        rowLabel: this.rowLabel(r),
        seatNumber: c + 1,
        type: '',
        price: 0
      }));

    this.serverService.getTicketPrices().subscribe({
      next: (prices) => {
        this.ticketPrices = prices || [];
        const defaultType = this.ticketPrices?.[0]?.type || 'normalny';
        items.forEach(i => i.type = defaultType);
        items.forEach(i => i.price = this.computePriceFor(i.type));
        this.checkoutItems = items;
        this.recomputeTotal();
        this.checkoutMode = true;
      },
      error: () => {
        const fallbackPrice = 20;
        items.forEach(i => { i.type = 'normalny'; i.price = fallbackPrice; });
        this.checkoutItems = items;
        this.recomputeTotal();
        this.checkoutMode = true;
      }
    });
  }

  onTypeChange(item: { type: string; price: number }) {
    item.price = this.computePriceFor(item.type);
    this.recomputeTotal();
  }

  private recomputeTotal() {
    this.totalPrice = this.checkoutItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  }

  private computePriceFor(type: string): number {
    try {
      const dateStr: string = this.schedule?.date;
      const timeStr: string = this.schedule?.time || '00:00';
      const [hh, mm] = (timeStr || '00:00').split(':').map((v: string) => parseInt(v, 10) || 0);
      const d = new Date(dateStr);
      if (!isNaN(hh)) d.setHours(hh, isNaN(mm) ? 0 : mm, 0, 0);

      const now = new Date();
      const msDiff = d.getTime() - now.getTime();
      const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

      const priceRow = (this.ticketPrices || []).find(p => (p.type || '').toLowerCase() === (type || '').toLowerCase());
      if (!priceRow) return 0;

      const isThursdayShow = d.getDay() === 4;
      const isThursdayPurchase = now.getDay() === 4;
      if ((isThursdayShow || isThursdayPurchase) && priceRow.cheap_thursday != null) {
        return Number(priceRow.cheap_thursday) || 0;
      }

      if (daysDiff >= 3 && priceRow.three_days_before != null) return Number(priceRow.three_days_before) || 0;
      if (daysDiff === 2 && priceRow.two_days_before != null) return Number(priceRow.two_days_before) || 0;
      if (daysDiff === 1 && priceRow.one_day_before != null) return Number(priceRow.one_day_before) || 0;
      return Number(priceRow.same_day) || 0;
    } catch {
      return 0;
    }
  }

  pay() {
    if (!this.checkoutMode || this.checkoutItems.length === 0) return;
    if (this.missingHall || !this.schedule?.hall) {
      this.paymentError = 'Brak przypisanej sali dla tego seansu. Skontaktuj się z administratorem.';
      return;
    }
    if (this.isPaying) return;
    this.isPaying = true;
    this.paymentError = null;

    const scheduleId = Number(this.route.snapshot.paramMap.get('id'));

    const seatsPayload = this.checkoutItems.map(i => ({
      row_index: i.row,
      col_index: i.col,
      row_label: i.rowLabel,
      seat_number: i.seatNumber,
      price: i.price,
      type: i.type,
      seat: `${i.rowLabel}-${i.seatNumber}`
    }));

    const origin = this.isBrowser ? window.location.origin : 'http://localhost:4200';
    const success_url = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}/purchase/${scheduleId}?canceled=1`;

    this.serverService.createStripeCheckoutSession({
      schedule_id: scheduleId,
      hall: String(this.schedule.hall),
      seats: seatsPayload,
      success_url,
      cancel_url
    }).subscribe({
      next: (result: { id: string; url: string }) => {
        this.isPaying = false;
        if (result?.url && this.isBrowser) {
          window.location.href = result.url;
        } else {
          this.paymentError = 'Nie udało się przekierować do płatności Stripe.';
        }
      },
      error: (err: any) => {
        this.isPaying = false;
        this.paymentError = err?.error?.detail || err?.message || 'Nieznany błąd podczas inicjacji płatności.';
      }
    });
  }
}