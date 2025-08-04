import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServerService } from '../services/server.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './tickets.component.html',
  styles: ``
})

export class TicketsComponent  implements OnInit  {
  constructor(private fb: FormBuilder, private authService: ServerService) {}
  tickets: any[] = [];

  ngOnInit(): void {
    this.authService.getUserTickets().subscribe({
      next: (tickets) => this.tickets = tickets,
      error: () => this.tickets = []
    });
  }
}
