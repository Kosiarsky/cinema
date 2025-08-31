import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServerService } from '../services/server.service';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { toAbs as toAbsHelper } from '../shared/env';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tickets-history',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule],
  templateUrl: './tickets-history.component.html',
  styles: ``
})

export class TicketsHistoryComponent  implements OnInit  {
  constructor(private serverService: ServerService, private router: Router) {}
  tickets: any[] = [];
  isLoading = true;
  showReviewFor: Record<number, boolean> = {};
  reviewForms: Partial<Record<number, { rating: number; comment: string; is_anonymous: boolean }>> = {};
  hoverRatings: Partial<Record<number, number>> = {};

  ngOnInit(): void {
    this.isLoading = true;
    this.serverService.getUserTickets().subscribe({
      next: (tickets) => {
        const now = new Date();
        this.tickets = tickets
          .filter(ticket => {
            if (!ticket.schedule?.date || !ticket.schedule?.time) return false;
            const dateTimeStr = `${ticket.schedule.date}T${ticket.schedule.time}`;
            const ticketDate = new Date(dateTimeStr);
            return ticketDate <= now;
          })
          .sort((a, b) => {
            const dateA = a.schedule?.date ? new Date(`${a.schedule.date}T${a.schedule.time}`).getTime() : 0;
            const dateB = b.schedule?.date ? new Date(`${b.schedule.date}T${b.schedule.time}`).getTime() : 0;
            return dateA - dateB;
          });
          this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.tickets = [];
      } 
    });
  }

  toAbs(url?: string): string {
    return (toAbsHelper(url) || '') as string;
  }

  private ensureForm(ticketId: number) {
    if (!this.reviewForms[ticketId]) {
      this.reviewForms[ticketId] = { rating: 0, comment: '', is_anonymous: false };
    }
  }

  toggleReview(ticketId: number) {
    this.showReviewFor[ticketId] = !this.showReviewFor[ticketId];
    if (this.showReviewFor[ticketId]) {
      this.ensureForm(ticketId);
    }
  }

  setRating(ticketId: number, val: number) {
    this.ensureForm(ticketId);
    this.reviewForms[ticketId]!.rating = val;
  }

  setHover(ticketId: number, val: number | null) {
    if (val == null) delete this.hoverRatings[ticketId];
    else this.hoverRatings[ticketId] = val;
  }

  getDisplayedRating(ticketId: number): number {
    const hover = this.hoverRatings[ticketId];
    if (typeof hover === 'number') return hover;
    return this.reviewForms[ticketId]?.rating || 0;
  }

  submitReview(ticket: any) {
    const movieId = ticket?.schedule?.movie?.id;
    const form = this.reviewForms[ticket.id] || { rating: 5, comment: '', is_anonymous: false };
    if (!movieId) return;
    const payload = { movie_id: movieId, rating: form.rating, comment: form.comment || null, is_anonymous: !!form.is_anonymous };
    this.serverService.createReview(payload).subscribe({
      next: () => {
        this.showReviewFor[ticket.id] = false;
        alert('Dziękujemy za ocenę!');
      },
      error: (err) => {
        const msg = err?.error?.detail || 'Nie udało się zapisać recenzji';
        alert(msg);
      }
    })
  }
}
