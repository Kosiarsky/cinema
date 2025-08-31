import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ServerService } from '../../services/server.service';
import { AdminMenuComponent } from '../admin-menu/admin-menu.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-movies-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminMenuComponent, RouterLink],
  templateUrl: './movies-admin.component.html'
})
export class MoviesAdminComponent implements OnInit {
  movies: any[] = [];
  categories: any[] = [];
  saving = false;
  error: string | null = null;
  form: any = { title: '', durationMinutes: null as number | null, image: '', big_image: '', trailer: '', cast: '', description: '', category_ids: [] as number[], premiere_date: '' };
  newCategoryName = '';
  editingId: number | null = null;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.load();
    this.api.getCategories().subscribe({ next: (c) => this.categories = c || [] });
  }

  load() {
    this.api.getMovies().subscribe({
      next: (m) => this.movies = m || [],
      error: () => this.error = 'Nie udało się pobrać filmów'
    });
  }

  addCategory() {
    const name = (this.newCategoryName || '').trim();
    if (!name) {
      this.error = 'Podaj nazwę kategorii';
      return;
    }
    this.error = null;
    this.api.createCategory(name).subscribe({
      next: (cat) => {
        const exists = this.categories.find((c: any) => c.id === cat.id);
        if (!exists) this.categories.push(cat);
        if (!this.form.category_ids.includes(cat.id)) {
          if (this.form.category_ids.length < 3) this.form.category_ids.push(cat.id);
        }
        this.newCategoryName = '';
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Błąd podczas tworzenia kategorii';
      }
    });
  }

  toggleCategory(catId: number) {
    const idx = this.form.category_ids.indexOf(catId);
    if (idx >= 0) {
      this.form.category_ids.splice(idx, 1);
    } else {
      if (this.form.category_ids.length >= 3) {
        this.error = 'Możesz wybrać maksymalnie 3 kategorie';
        return;
      }
      this.error = null;
      this.form.category_ids.push(catId);
    }
  }

  isSelected(catId: number): boolean {
    return this.form.category_ids.includes(catId);
  }

  private minutesToHM(v: any): string {
    const n = Math.max(0, parseInt(String(v ?? ''), 10) || 0);
    const h = Math.floor(n / 60);
    const m = n % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }

  private hmToMinutes(hm: string | null | undefined): number | null {
    if (!hm) return null;
    const s = String(hm);
    const hMatch = s.match(/(\d+)h/);
    const mMatch = s.match(/(\d+)m/);
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    const total = h * 60 + m;
    return total || null;
  }

  formatDurationPreview(v: any): string {
    return this.minutesToHM(v);
  }

  private buildPayload(src: any) {
    const trimOrNull = (v: any) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s.length ? s : null;
    };
    const selectedNames = (src.category_ids || [])
      .map((id: number) => this.categories.find((c: any) => c.id === id)?.name)
      .filter((n: string | undefined) => !!n) as string[];
    const derivedGenre = selectedNames.length ? selectedNames.join(', ') : 'Inne';

    return {
      title: trimOrNull(src.title) || '',
      genre: derivedGenre,
      duration: this.minutesToHM(src.durationMinutes),
      rating: 0.0,
      description: trimOrNull(src.description),
      image: trimOrNull(src.image),
      big_image: trimOrNull(src.big_image),
      trailer: trimOrNull(src.trailer),
      cast: trimOrNull(src.cast),
      category_ids: src.category_ids || [],
      premiere_date: trimOrNull(src.premiere_date)
    };
  }

  onFileSelectedSmall(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      this.error = 'Dozwolone tylko pliki PNG lub JPG';
      input.value = '';
      return;
    }
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.form.image = res.url;
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Błąd przesyłania obrazu';
      }
    });
  }

  onFileSelectedBig(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      this.error = 'Dozwolone tylko pliki PNG lub JPG';
      input.value = '';
      return;
    }
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.form.big_image = res.url;
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Błąd przesyłania obrazu';
      }
    });
  }

  createMovie(formRef?: NgForm) {
    const f = this.form;
    const mins = parseInt(String(f.durationMinutes ?? ''), 10);
    const minutesOk = !isNaN(mins) && mins > 0;
    const allFilled = [f.title, f.image, f.big_image, f.trailer, f.cast, f.description]
      .every((v: any) => String(v ?? '').trim().length > 0) && minutesOk;
    if (!allFilled) {
      this.error = 'Uzupełnij wszystkie pola';
      formRef?.control.markAllAsTouched();
      return;
    }

    this.saving = true; this.error = null;
    const payload = this.buildPayload(this.form);
    this.api.createMovie(payload).subscribe({
      next: () => {
        this.saving = false;
        this.resetForm(formRef);
        this.load();
      },
      error: (e) => { this.saving = false; this.error = e?.error?.detail || 'Błąd podczas dodawania'; }
    });
  }

  editMovieStart(m: any) {
    this.editingId = m.id;
    this.form = {
      title: m.title || '',
      durationMinutes: this.hmToMinutes(m.duration),
      image: m.image || '',
      big_image: m.big_image || '',
      trailer: m.trailer || '',
      cast: m.cast || '',
      description: m.description || '',
      category_ids: (m.categories || []).map((c: any) => c.id),
      premiere_date: m.premiere_date || ''
    };
    this.error = null;
  }

  cancelEdit(formRef?: NgForm) {
    this.editingId = null;
    this.resetForm(formRef);
  }

  saveEdit(formRef?: NgForm) {
    if (!this.editingId) return;
    const f = this.form;
    const mins = parseInt(String(f.durationMinutes ?? ''), 10);
    const minutesOk = !isNaN(mins) && mins > 0;
    const allFilled = [f.title, f.image, f.big_image, f.trailer, f.cast, f.description]
      .every((v: any) => String(v ?? '').trim().length > 0) && minutesOk;
    if (!allFilled) {
      this.error = 'Uzupełnij wszystkie pola';
      formRef?.control.markAllAsTouched();
      return;
    }
    this.saving = true; this.error = null;
    const payload = this.buildPayload(this.form);
    this.api.updateMovie(this.editingId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.editingId = null;
        this.resetForm(formRef);
        this.load();
      },
      error: (e) => { this.saving = false; this.error = e?.error?.detail || 'Błąd podczas zapisu'; }
    });
  }

  deleteMovie(id: number) {
    if (!confirm('Usunąć film?')) return;
    this.api.deleteMovie(id).subscribe({
      next: () => this.load(),
      error: () => this.error = 'Błąd podczas usuwania'
    });
  }

  private resetForm(formRef?: NgForm) {
    this.form = { title: '', durationMinutes: null, image: '', big_image: '', trailer: '', cast: '', description: '', category_ids: [], premiere_date: '' };
    formRef?.resetForm();
  }
}
