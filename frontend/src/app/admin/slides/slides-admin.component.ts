import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServerService } from '../../services/server.service';
import { AdminMenuComponent } from '../admin-menu/admin-menu.component';

@Component({
  selector: 'app-slides-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './slides-admin.component.html'
})
export class SlidesAdminComponent implements OnInit {
  slides: any[] = [];
  movies: any[] = [];
  form: any = { title: '', description: '', image: '', movie_id: null, is_public: true };
  editing: Record<number, any> = {};
  error: string | null = null;
  success: string | null = null;
  uploading = false;
  draggingId: number | null = null;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.load();
    this.api.getMovies().subscribe(m => this.movies = m || []);
  }

  load() {
    this.api.adminListSlides().subscribe({
      next: (rows) => { this.slides = (rows || []).sort((a,b)=> (a.sort_order??0)-(b.sort_order??0) || b.id-a.id); },
      error: (e) => this.error = e?.error?.detail || 'Nie udało się pobrać slajdów'
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
    if (!this.form.title || !this.form.image) { this.error = 'Tytuł i obraz są wymagane'; return; }
    this.error = null; this.success = null;
    this.api.adminCreateSlide({
      title: this.form.title.trim(),
      description: this.form.description?.trim() || null,
      image: this.form.image.trim(),
      movie_id: this.form.movie_id || null,
      sort_order: 1,
      is_public: !!this.form.is_public,
    }).subscribe({
      next: () => { this.form = { title: '', description: '', image: '', movie_id: null, is_public: true }; this.success = 'Dodano slajd'; this.load(); },
      error: (e) => this.error = e?.error?.detail || 'Błąd podczas dodawania slajdu'
    });
  }

  startEdit(s: any) { this.editing[s.id] = { title: s.title, description: s.description, image: s.image, movie_id: s.movie_id || null, is_public: !!s.is_public };
  }
  cancelEdit(id: number) { delete this.editing[id]; }
  save(id: number) {
    if (!confirm('Zapisać zmiany dla tego slajdu?')) return;
    const e = this.editing[id];
    if (!e) return;
    this.error = null; this.success = null;
    this.api.adminUpdateSlide(id, { title: e.title, description: e.description, image: e.image, movie_id: e.movie_id || null, is_public: !!e.is_public }).subscribe({
      next: () => { delete this.editing[id]; this.success = 'Zapisano zmiany'; this.load(); },
      error: (err) => this.error = err?.error?.detail || 'Błąd podczas zapisu'
    });
  }
  remove(id: number) {
    if (!confirm('Usunąć slajd? Tej operacji nie można cofnąć.')) return;
    this.api.adminDeleteSlide(id).subscribe({
      next: () => { this.success = 'Usunięto slajd'; this.load(); },
      error: (err) => this.error = err?.error?.detail || 'Błąd podczas usuwania'
    });
  }

  onDragStart(id: number) { this.draggingId = id; }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }
  onDrop(targetId: number) {
    if ((this.draggingId == null) || (this.draggingId === targetId)) return;
    const fromIdx = this.slides.findIndex(s => s.id === this.draggingId);
    const toIdx = this.slides.findIndex(s => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = this.slides.splice(fromIdx, 1);
    this.slides.splice(toIdx, 0, moved);
    this.slides.forEach((s, i) => s.sort_order = i + 1);
    this.slides.forEach(s => this.api.adminUpdateSlide(s.id, { sort_order: s.sort_order }).subscribe());
    this.success = 'Zmieniono kolejność';
    this.draggingId = null;
  }
}
