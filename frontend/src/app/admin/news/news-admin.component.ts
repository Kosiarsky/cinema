import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu.component';
import { ServerService } from '../../services/server.service';

@Component({
  selector: 'app-news-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './news-admin.component.html'
})
export class NewsAdminComponent implements OnInit {
  list: any[] = [];
  movies: any[] = [];
  form: any = { title: '', content: '', date: '', image: '', movie_id: null, is_public: true };
  editing: Record<number, any> = {};
  error: string | null = null;
  success: string | null = null;
  uploading = false;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.load();
    this.api.getMovies().subscribe(m => this.movies = m || []);
  }

  load() {
    this.api.adminListNews().subscribe({
      next: (rows) => { this.list = rows || []; },
      error: (e) => this.error = e?.error?.detail || 'Nie udało się pobrać aktualności'
    });
  }

  onCreateFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadImage(file).subscribe({
      next: (res) => { this.form.image = res.url; this.uploading = false; },
      error: () => { this.error = 'Błąd przesyłania obrazu'; this.uploading = false; }
    });
  }

  onEditFileChange(id: number, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadImage(file).subscribe({
      next: (res) => { if (this.editing[id]) this.editing[id].image = res.url; this.uploading = false; },
      error: () => { this.error = 'Błąd przesyłania obrazu'; this.uploading = false; }
    });
  }

  create() {
    if (!this.form.title) { this.error = 'Wymagany tytuł'; return; }
    this.error = null; this.success = null;
    this.api.adminCreateNews({
      title: this.form.title.trim(),
      content: this.form.content?.trim() || null,
      date: this.form.date || null,
      image: this.form.image?.trim() || null,
      movie_id: this.form.movie_id || null,
      is_public: !!this.form.is_public,
    }).subscribe({
      next: () => { this.form = { title: '', content: '', date: '', image: '', movie_id: null, is_public: true }; this.success = 'Dodano aktualność'; this.load(); },
      error: (e) => this.error = e?.error?.detail || 'Błąd podczas dodawania'
    });
  }

  startEdit(row: any) {
    this.editing[row.id] = { title: row.title, content: row.content, date: row.date, image: row.image, movie_id: row.movie_id || null, is_public: !!row.is_public };
  }
  cancelEdit(id: number) { delete this.editing[id]; }
  save(id: number) {
    if (!confirm('Zapisać zmiany?')) return;
    const e = this.editing[id];
    if (!e) return;
    this.error = null; this.success = null;
    this.api.adminUpdateNews(id, { title: e.title, content: e.content, date: e.date, image: e.image, movie_id: e.movie_id || null, is_public: !!e.is_public }).subscribe({
      next: () => { delete this.editing[id]; this.success = 'Zapisano zmiany'; this.load(); },
      error: (err) => this.error = err?.error?.detail || 'Błąd podczas zapisu'
    });
  }
  remove(id: number) {
    if (!confirm('Usunąć aktualność? Tej operacji nie można cofnąć.')) return;
    this.api.adminDeleteNews(id).subscribe({
      next: () => { this.success = 'Usunięto'; this.load(); },
      error: (err) => this.error = err?.error?.detail || 'Błąd podczas usuwania'
    });
  }

  getMovieTitle(id?: number | null): string {
    if (!id) return '';
    const m = (this.movies || []).find(x => x?.id === id);
    return m?.title || '';
  }
}
