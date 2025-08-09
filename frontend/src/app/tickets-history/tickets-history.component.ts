import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServerService } from '../services/server.service';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tickets-history',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './tickets-history.component.html',
  styles: ``
})

export class TicketsHistoryComponent  implements OnInit  {
  constructor(private serverService: ServerService, private router: Router) {}
  tickets: any[] = [];
  isLoading = true;

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
}
