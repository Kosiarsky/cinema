import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './purchase.component.html',
  styles: [` 
    .screen { text-align: center; margin: 16px 0; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; text-transform: uppercase; font-weight: bold; width: 100%; font-size: 16px; }
    .seat-layout { display:flex; gap:16px; justify-content:center; align-items:flex-start; }
    .seat-grid { display: grid; gap: 6px; justify-content: center; }
    .row { display: flex; gap: 6px; justify-content: center; margin-bottom: 4px; align-items:center; }
    .row-label { width: 20px; text-align: right; margin-right: 6px; opacity: 0.85; font-weight: 600; }
    .seat { width: 28px; height: 28px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size: 12px; cursor: pointer; user-select: none; }
    .seat.available { background: #2d6a4f; }
    .seat.blocked { background: #9e2a2b; cursor:not-allowed; }
    .seat.selected { background: #1d3557; }
    .seat2 { background: rgba(255,255,255,0.2); width: 55px; height: 28px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size: 12px;  user-select: none; }
    .legend { display:flex; gap:12px; justify-content:center; margin: 8px 0 16px; }
    .legend .box { width: 16px; height: 16px; border-radius: 4px; display:inline-block; margin-right:6px; }
    .exit-indicator { height: 100px; color: #ddd; font-weight: bold; background: rgba(255,255,255,0.2); border-radius: 6px; padding: 8px 6px; font-size: 12px; letter-spacing: 1px; writing-mode: vertical-rl; text-orientation: mixed; align-self: stretch; display:flex; align-items:center; justify-content:center; }
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

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.serverService.getScheduleById(id).subscribe({
      next: (schedule) => {
        this.schedule = schedule;
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
}