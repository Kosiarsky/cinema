import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServerService } from '../../services/server.service';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.component.html'
})
export class UsersAdminComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error: string | null = null;
  search = '';

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.adminListUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Błąd podczas ładowania użytkowników';
        this.loading = false;
      }
    });
  }

  filtered() {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  }

  toggleAdmin(u: any) {
    const newVal = u.is_admin ? 0 : 1;
    this.api.adminUpdateUser(u.id, { is_admin: newVal }).subscribe({
      next: (res) => { u.is_admin = newVal; },
      error: () => { }
    });
  }

  saveInline(u: any) {
    const payload: any = {
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone
    };
    this.api.adminUpdateUser(u.id, payload).subscribe();
  }

  delete(u: any) {
    if (!confirm(`Usunąć użytkownika ${u.email}?`)) return;
    this.api.adminDeleteUser(u.id).subscribe({
      next: () => { this.users = this.users.filter(x => x.id !== u.id); },
      error: () => {}
    });
  }
}
