import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServerService } from '../../services/server.service';
import { AdminMenuComponent } from '../admin-menu/admin-menu.component';

@Component({
  selector: 'app-prices-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './prices-admin.component.html'
})
export class PricesAdminComponent implements OnInit {
  rows: any[] = [];
  editing: Record<number, any> = {};
  error: string | null = null;
  success: string | null = null;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.adminListTicketPrices().subscribe({
      next: (rows) => this.rows = rows || [],
      error: (e) => this.error = e?.error?.detail || 'Nie udało się pobrać cennika'
    });
  }

  startEdit(row: any) { this.editing[row.id] = { ...row }; }
  cancelEdit(id: number) { delete this.editing[id]; }
  save(id: number) {
    const e = this.editing[id];
    if (!e) return;
    this.api.adminUpdateTicketPrice(id, {
      type: e.type,
      cheap_thursday: e.cheap_thursday,
      three_days_before: e.three_days_before,
      two_days_before: e.two_days_before,
      one_day_before: e.one_day_before,
      same_day: e.same_day
    }).subscribe({
      next: () => { delete this.editing[id]; this.success = 'Zapisano zmiany'; this.load(); },
      error: (er) => this.error = er?.error?.detail || 'Błąd podczas zapisu'
    });
  }
}
