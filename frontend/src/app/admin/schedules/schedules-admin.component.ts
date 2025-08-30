import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServerService } from '../../services/server.service';
import { AdminMenuComponent } from '../admin-menu/admin-menu.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-schedules-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './schedules-admin.component.html'
})
export class SchedulesAdminComponent implements OnInit {
  schedules: any[] = [];
  movies: any[] = [];
  // Use numeric halls instead of labels like 'Sala X'
  halls: number[] = [1, 2, 3, 4];
  day: string = '';
  cleaningBufferMin: number = 15;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  // Plan keyed by numeric hall
  plan: Record<number, Array<{ time: string; movie_id: number | null; movie_type?: string }>> = {} as any;
  existingBlocks: Record<number, Array<{ start: number; end: number; label: string; id?: number }>> = {} as any;
  editingExisting: Record<number, { time: string; movie_type: string; hall: number } | null> = {};
  private dragCtx: { hall: number; index: number } | null = null;
  form: any = { movie_id: null, date: '', time: '', movie_type: '', hall: 0 };
  timeStepMin: number = 30; 
  dayStartMin: number = 8 * 60;    
  dayEndMin: number = 23 * 60 + 30;  
  copyDays: number = 1;
  copying = false;
  // Selection of halls keyed by numeric hall
  copyHalls: Record<number, boolean> = {} as any;
  copySkipDuplicates: boolean = true;

  // New: select specific target dates
  upcomingDays: string[] = [];
  copyTargets: Record<string, boolean> = {};
  selectAllTargets = false;

  constructor(private api: ServerService) {}

  ngOnInit(): void {
    this.day = this.todayISO();
    this.ensurePlanStructure();
    this.loadMovies();
    this.load();
    this.rebuildUpcomingDays();
  }

  private todayISO(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onDayChange() {
    this.ensurePlanStructure();
    this.rebuildExistingBlocks();
    this.rebuildUpcomingDays();
  }

  ensurePlanStructure() {
    for (const hall of this.halls) {
      if (!this.plan[hall]) this.plan[hall] = [];
      if (this.copyHalls[hall] === undefined) this.copyHalls[hall] = true;
    }
  }

  // Build list of next 14 days after selected day
  rebuildUpcomingDays() {
    const keep = { ...this.copyTargets };
    this.upcomingDays = [];
    for (let i = 1; i <= 14; i++) {
      this.upcomingDays.push(this.addDaysISO(this.day, i));
    }
    this.copyTargets = {};
    for (const d of this.upcomingDays) {
      this.copyTargets[d] = keep[d] ?? false;
    }
  }

  toggleSelectAllTargets(val: boolean) {
    this.selectAllTargets = val;
    for (const d of this.upcomingDays) this.copyTargets[d] = val;
  }

  // New: toggle a single hall (for button-style hall selection)
  toggleHall(h: number) {
    this.copyHalls[h] = !this.copyHalls[h];
  }

  // New: toggle a single target day (for button-style selection)
  toggleDay(d: string) {
    this.copyTargets[d] = !this.copyTargets[d];
  }

  // New: check if any target day is selected
  hasAnyTargetSelected(): boolean {
    return this.upcomingDays.some(d => !!this.copyTargets[d]);
  }

  loadMovies() {
    this.api.getMovies().subscribe({
      next: (m) => { this.movies = m || []; this.rebuildExistingBlocks(); },
      error: () => this.error = 'Nie udało się pobrać listy filmów'
    });
  }

  load() {
    this.api.getRepertoire().subscribe({
      next: (s) => { this.schedules = s || []; this.rebuildExistingBlocks(); },
      error: () => this.error = 'Nie udało się pobrać seansów'
    });
  }

  private toMinutes(hhmm: string): number | null {
    if (!hhmm) return null;
    const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(hhmm);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (isNaN(h) || isNaN(min)) return null;
    return h * 60 + min;
  }
  private toHHMM(total: number): string {
    const t = Math.max(0, total);
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  private parseDurationToMinutes(val: string | null | undefined): number | null {
    if (!val) return null;
    const s = String(val).trim();
    const m1 = /^(\d{1,2}):(\d{2})$/.exec(s);

    if (m1) return parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
    const m2 = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i.exec(s);

    if (m2 && (m2[1] || m2[2])) {
      const h = m2[1] ? parseInt(m2[1], 10) : 0;
      const min = m2[2] ? parseInt(m2[2], 10) : 0;
      return h * 60 + min;
    }

    const num = parseInt(s, 10);
    if (!isNaN(num)) return num;
    return null;
  }
  private getMovieDurationMin(movieId: number | null | undefined): number | null {
    if (!movieId) return null;
    const mv = this.movies.find((m: any) => m.id === movieId);
    const dur = mv?.duration ?? null;
    return this.parseDurationToMinutes(dur);
  }

  private buildTimeSlots(): string[] {
    const slots: string[] = [];
    for (let m = this.dayStartMin; m <= this.dayEndMin; m += this.timeStepMin) {
      slots.push(this.toHHMM(m));
    }
    return slots;
  }

  private getUsedTimesForHall(hall: number, excludeIndex: number | null = null): Set<string> {
    const used = new Set<string>();
    for (const s of this.getExistingForHall(hall)) {
      const t = (s.time || '').trim();
      if (t) used.add(t);
    }

    const rows = this.plan[hall] || [];
    rows.forEach((r, i) => {
      if (excludeIndex !== null && i === excludeIndex) return;
      const t = (r.time || '').trim();
      if (t) used.add(t);
    });
    return used;
  }

  getAvailableTimes(hall: number, index: number, currentTime?: string): string[] {
    const all = this.buildTimeSlots();
    const usedEquals = this.getUsedTimesForHall(hall, index);
    const row = (this.plan[hall] || [])[index];
    const dur = this.getMovieDurationMin(row?.movie_id);

    return all.filter(t => {
      if (t === (currentTime || '')) return true;
      if (usedEquals.has(t)) return false;
      if (dur == null) return true;

      const start = this.toMinutes(t)!;
      const candidate = { start, end: start + dur + this.cleaningBufferMin };

      if ((this.existingBlocks[hall] || []).some(b => this.overlaps(candidate, b))) return false;

      const rows = this.plan[hall] || [];
      for (let i = 0; i < rows.length; i++) {
        if (i === index) continue;
        const iv = this.computeInterval(rows[i]);
        if (iv && this.overlaps(candidate, iv)) return false;
      }

      return true;
    });
  }

  getAvailableTimesForExisting(hall: number, scheduleId: number, currentTime?: string): string[] {
    const all = this.buildTimeSlots();
    const used = new Set<string>();
    for (const s of this.getExistingForHall(hall)) {
      if (s.id === scheduleId) continue;
      const t = (s.time || '').trim();
      if (t) used.add(t);
    }
    for (const r of (this.plan[hall] || [])) {
      const t = (r.time || '').trim();
      if (t) used.add(t);
    }

    const sched = (this.schedules || []).find((x: any) => x.id === scheduleId);
    const durStr = sched?.movie?.duration ?? (this.movies.find((m: any) => m.id === (sched?.movie?.id || sched?.movie_id))?.duration);
    const dur = this.parseDurationToMinutes(durStr);

    return all.filter(t => {
      if (t === (currentTime || '')) return true;
      if (used.has(t)) return false;
      if (dur == null) return true; 

      const start = this.toMinutes(t)!;
      const candidate = { start, end: start + dur + this.cleaningBufferMin };

      for (const o of this.getExistingForHall(hall)) {
        if (o.id === scheduleId) continue;
        const os = this.toMinutes(o.time || '');
        const odurStr = o.movie?.duration ?? (this.movies.find((m: any) => m.id === (o.movie?.id || o.movie_id))?.duration);
        const odur = this.parseDurationToMinutes(odurStr);
        if (os == null || odur == null) continue;
        const oiv = { start: os, end: os + odur + this.cleaningBufferMin };
        if (this.overlaps(candidate, oiv)) return false;
      }

      for (const row of (this.plan[hall] || [])) {
        const iv = this.computeInterval(row);
        if (iv && this.overlaps(candidate, iv)) return false;
      }

      return true;
    });
  }

  getPlan(hall: number) {
    return this.plan?.[hall] || [];
  }

  addRow(hall: number) {
    if (!this.plan[hall]) this.plan[hall] = [];
    const defaultMovie = this.movies.length ? this.movies[0].id : null;
    this.plan[hall].push({ time: '', movie_id: defaultMovie, movie_type: 'napisy' });
  }

  removeRow(hall: number, idx: number) {
    this.plan[hall].splice(idx, 1);
  }

  onRowChange(hall: number) {
    this.sortHallPlan(hall);
  }

  sortHallPlan(hall: number) {
    const rows = this.plan[hall];
    rows.sort((a, b) => {
      const am = this.toMinutes(a.time || '') ?? 0;
      const bm = this.toMinutes(b.time || '') ?? 0;
      return am - bm;
    });
  }

  onDragStart(hall: number, index: number, ev: DragEvent) {
    this.dragCtx = { hall, index };
  }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }
  onDrop(hall: number, index: number, ev: DragEvent) {
    ev.preventDefault();
    if (!this.dragCtx || this.dragCtx.hall !== hall) return;
    const from = this.dragCtx.index;
    const to = index;
    if (from === to) return;
    const arr = this.plan[hall];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    this.dragCtx = null;
  }

  getEndTimeLabel(row: { time: string; movie_id: number | null; movie_type?: string }): string {
    const start = this.toMinutes(row.time || '');
    const dur = this.getMovieDurationMin(row.movie_id);
    if (start == null || dur == null) return '';
    const end = start + dur + this.cleaningBufferMin;
    return `${this.toHHMM(start)}–${this.toHHMM(end)} (w tym +${this.cleaningBufferMin} min sprzątania)`;
  }

  private computeInterval(row: { time: string; movie_id: number | null }): { start: number; end: number } | null {
    const start = this.toMinutes(row.time || '');
    const dur = this.getMovieDurationMin(row.movie_id);
    if (start == null || dur == null) return null;
    return { start, end: start + dur + this.cleaningBufferMin };
  }

  private overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
    return a.start < b.end && b.start < a.end;
  }

  isRowConflictingWithinPlan(hall: number, index: number): boolean {
    const rows = this.getPlan(hall);
    const curr = this.computeInterval(rows[index]);
    if (!curr) return false;
    for (let i = 0; i < rows.length; i++) {
      if (i === index) continue;
      const other = this.computeInterval(rows[i]);
      if (!other) continue;
      if (this.overlaps(curr, other)) return true;
    }
    return false;
  }

  isRowConflictingWithExisting(hall: number, index: number): boolean {
    const rows = this.getPlan(hall);
    const curr = this.computeInterval(rows[index]);
    if (!curr) return false;
    const blocks = this.existingBlocks[hall] || [];
    return blocks.some(b => this.overlaps(curr, b));
  }

  hasAnyConflicts(): boolean {
    for (const hall of this.halls) {
      const rows = this.getPlan(hall);
      for (let i = 0; i < rows.length; i++) {
        if (this.isRowConflictingWithinPlan(hall, i) || this.isRowConflictingWithExisting(hall, i)) return true;
      }
    }
    return false;
  }

  rebuildExistingBlocks() {
    const blocks: Record<number, Array<{ start: number; end: number; label: string; id?: number }>> = {} as any;
    for (const hall of this.halls) blocks[hall] = [];
    const list = (this.schedules || []).filter((s: any) => s.date === this.day);
    for (const s of list) {
      const hall: number = Number(s.hall || 0);
      if (!hall || !blocks[hall]) continue;
      const start = this.toMinutes(s.time || '');
      const durStr = s.movie?.duration ?? (this.movies.find((m: any) => m.id === (s.movie?.id || s.movie_id))?.duration);
      const dur = this.parseDurationToMinutes(durStr);
      if (start == null || dur == null) continue;
      const end = start + dur + this.cleaningBufferMin;
      const label = `${this.toHHMM(start)}–${this.toHHMM(end)} ${s.movie?.title || ''}`.trim();
      blocks[hall].push({ start, end, label, id: s.id });
    }
    this.existingBlocks = blocks;
  }

  createSchedule() {
    this.savePlan();
  }

  getExistingForHall(hall: number) {
    return (this.schedules || []).filter((s: any) => s.date === this.day && Number(s.hall || 0) === hall);
  }
  getExistingForHallSorted(hall: number) {
    const list = this.getExistingForHall(hall).slice();
    return list.sort((a: any, b: any) => {
      const ta = this.toMinutes(a.time || '') ?? 0;
      const tb = this.toMinutes(b.time || '') ?? 0;
      if (ta !== tb) return ta - tb;
      return (a.movie?.title || '').localeCompare(b.movie?.title || '');
    });
  }
  existingEndLabel(s: any): string {
    const start = this.toMinutes(s.time || '');
    const durStr = s.movie?.duration ?? (this.movies.find((m: any) => m.id === (s.movie?.id || s.movie_id))?.duration);
    const dur = this.parseDurationToMinutes(durStr);
    if (start == null || dur == null) return '';
    const end = start + dur + this.cleaningBufferMin;
    return `${this.toHHMM(start)}–${this.toHHMM(end)}`;
  }
  startEditExisting(s: any) {
    this.editingExisting[s.id] = { time: s.time, movie_type: s.movie_type || 'napisy', hall: Number(s.hall || 0) || this.halls[0] };
  }
  cancelEditExisting(id: number) {
    delete this.editingExisting[id];
  }
  isExistingEditConflicting(hall: number, s: any): boolean {
    const edit = this.editingExisting[s.id];
    if (!edit) return false;
    const start = this.toMinutes(edit.time || '');
    const durStr = s.movie?.duration ?? (this.movies.find((m: any) => m.id === (s.movie?.id || s.movie_id))?.duration);
    const dur = this.parseDurationToMinutes(durStr);
    if (start == null || dur == null) return false;
    const curr = { start, end: start + dur + this.cleaningBufferMin };
    const others = this.getExistingForHall(hall).filter((x: any) => x.id !== s.id);
    for (const o of others) {
      const os = this.toMinutes(o.time || '');
      const odurStr = o.movie?.duration ?? (this.movies.find((m: any) => m.id === (o.movie?.id || o.movie_id))?.duration);
      const odur = this.parseDurationToMinutes(odurStr);
      if (os == null || odur == null) continue;
      const oiv = { start: os, end: os + odur + this.cleaningBufferMin };
      if (this.overlaps(curr, oiv)) return true;
    }

    for (const row of (this.plan[hall] || [])) {
      const iv = this.computeInterval(row);
      if (!iv) continue;
      if (this.overlaps(curr, iv)) return true;
    }
    return false;
  }
  saveEditExisting(s: any) {
    const edit = this.editingExisting[s.id];
    if (!edit) return;
    if (this.isExistingEditConflicting(edit.hall || (Number(s.hall || 0) || this.halls[0]), s)) {
      this.error = 'Konflikt czasowy podczas edycji seansu';
      return;
    }
    this.error = null;
    const payload: any = { time: (edit.time || '').trim(), movie_type: edit.movie_type || null, hall: edit.hall || null };
    this.api.updateSchedule(s.id, payload).subscribe({
      next: () => { delete this.editingExisting[s.id]; this.load(); },
      error: (e) => this.error = e?.error?.detail || 'Błąd podczas zapisu edycji'
    });
  }
  deleteExisting(s: any) {
    if (!confirm('Usunąć seans?')) return;
    this.api.deleteSchedule(s.id).subscribe({
      next: () => this.load(),
      error: () => this.error = 'Błąd podczas usuwania seansu'
    });
  }

  savePlan() {
    const payloads: any[] = [];
    for (const hall of this.halls) {
      for (const entry of (this.plan[hall] || [])) {
        const time = (entry.time || '').trim();
        if (!entry.movie_id || !time) continue;
        payloads.push({ movie_id: entry.movie_id, date: this.day, time, movie_type: entry.movie_type || null, hall });
      }
    }
    if (!payloads.length) {
      this.error = 'Brak seansów do zapisania';
      return;
    }
    if (this.hasAnyConflicts()) {
      this.error = 'Nie można zapisać: konflikty czasowe w planie.';
      return;
    }
    this.error = null;
    this.saving = true;
    const calls = payloads.map(p => this.api.createSchedule(p));
    forkJoin(calls).subscribe({
      next: () => { 
        this.saving = false; 
        for (const hall of this.halls) {
          this.plan[hall] = [];
        }
        this.load(); 
      },
      error: (e) => { this.saving = false; this.error = e?.error?.detail || 'Błąd podczas zapisu planu'; }
    });
  }

  copyToNextDays() {
    const days = Math.max(1, Math.floor(this.copyDays || 0));
    const halls = this.halls.filter(h => !!this.copyHalls[h]);
    if (!halls.length) {
      this.error = 'Wybierz przynajmniej jedną salę do kopiowania';
      return;
    }
    const source = (this.schedules || []).filter((s: any) => s.date === this.day && halls.includes(Number(s.hall || 0)));
    if (!source.length) {
      this.error = 'Brak seansów w wybranym dniu do skopiowania';
      return;
    }

    const payloads: any[] = [];
    const seen = new Set<string>();
    for (let offset = 1; offset <= days; offset++) {
      const targetDay = this.addDaysISO(this.day, offset);
      for (const s of source) {
        const hall = Number(s.hall || 0);
        const time = (s.time || '').trim();
        if (!time || !hall) continue;
        const key = `${targetDay}|${hall}|${time}`;
        if (this.copySkipDuplicates && (this.hasExistingAt(targetDay, hall, time) || seen.has(key))) continue;
        const movieId = s.movie?.id ?? s.movie_id;
        if (!movieId) continue;
        payloads.push({ movie_id: movieId, date: targetDay, time, movie_type: s.movie_type || null, hall });
        seen.add(key);
      }
    }

    if (!payloads.length) {
      this.error = 'Nie ma nic do skopiowania (duplikaty lub brak danych)';
      return;
    }

    this.error = null;
    this.copying = true;
    const calls = payloads.map(p => this.api.createSchedule(p));
    forkJoin(calls).subscribe({
      next: () => { this.copying = false; this.load(); },
      error: (e) => { this.copying = false; this.error = e?.error?.detail || 'Błąd podczas kopiowania repertuaru'; }
    });
  }

  copyToSelectedDays() {
    const halls = this.halls.filter(h => !!this.copyHalls[h]);
    if (!halls.length) {
      this.error = 'Wybierz przynajmniej jedną salę do kopiowania';
      return;
    }
    const targets = this.upcomingDays.filter(d => !!this.copyTargets[d]);
    if (!targets.length) {
      this.error = 'Zaznacz co najmniej jeden dzień docelowy';
      return;
    }
    const source = (this.schedules || []).filter((s: any) => s.date === this.day && halls.includes(Number(s.hall || 0)));
    if (!source.length) {
      this.error = 'Brak seansów w wybranym dniu do skopiowania';
      return;
    }

    const payloads: any[] = [];
    const seen = new Set<string>();
    for (const targetDay of targets) {
      for (const s of source) {
        const hall = Number(s.hall || 0);
        const time = (s.time || '').trim();
        if (!time || !hall) continue;
        const key = `${targetDay}|${hall}|${time}`;
        if (this.copySkipDuplicates && (this.hasExistingAt(targetDay, hall, time) || seen.has(key))) continue;
        const movieId = s.movie?.id ?? s.movie_id;
        if (!movieId) continue;
        payloads.push({ movie_id: movieId, date: targetDay, time, movie_type: s.movie_type || null, hall });
        seen.add(key);
      }
    }

    if (!payloads.length) {
      this.error = 'Nie ma nic do skopiowania (duplikaty lub brak danych)';
      return;
    }

    this.error = null;
    this.success = null;
    this.copying = true;
    const createdPlanned = payloads.length;
    const calls = payloads.map(p => this.api.createSchedule(p));
    forkJoin(calls).subscribe({
      next: () => { 
        this.copying = false; 
        this.load();
        // Clear selected target days
        for (const d of this.upcomingDays) this.copyTargets[d] = false;
        this.selectAllTargets = false;
        // Also clear selected halls
        for (const h of this.halls) this.copyHalls[h] = false;
        this.success = `Skopiowano ${createdPlanned} seansów.`;
      },
      error: (e) => { this.copying = false; this.error = e?.error?.detail || 'Błąd podczas kopiowania repertuaru'; this.success = null; }
    });
  }

  private addDaysISO(dateISO: string, delta: number): string {
    const [y, m, d] = dateISO.split('-').map(n => parseInt(n, 10));
    const base = new Date(y, (m - 1), d);
    base.setDate(base.getDate() + delta);
    const yy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  labelForISO(dateISO: string): string {
    const [y, m, d] = dateISO.split('-').map(n => parseInt(n, 10));
    const dt = new Date(y, (m - 1), d);
    return dt.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  private hasExistingAt(dateISO: string, hall: number, time: string): boolean {
    return (this.schedules || []).some((s: any) => (s.date === dateISO) && (Number(s.hall || 0) === hall) && ((s.time || '') === time));
  }
}
