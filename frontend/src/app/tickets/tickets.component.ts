import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServerService } from '../services/server.service';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './tickets.component.html',
  styles: ``
})

export class TicketsComponent  implements OnInit  {
  constructor(private serverService: ServerService, private router: Router) {}
  tickets: any[] = [];

  ngOnInit(): void {
  this.serverService.getUserTickets().subscribe({
    next: (tickets) => {
      this.tickets = tickets.sort((a, b) => {
        const dateA = a.schedule?.date ? new Date(a.schedule.date).getTime() : 0;
        const dateB = b.schedule?.date ? new Date(b.schedule.date).getTime() : 0;
        return dateA - dateB;
      });
    },
    error: () => this.tickets = []
  });
}
}
