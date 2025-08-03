import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ServerService } from '../services/server.service';

@Component({
  selector: 'app-pricelist',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './pricelist.component.html',
  styles: ``,
})

export class PricelistComponent {
  ticketPrices: any[] = [];

  constructor(private serverService: ServerService) {}

  ngOnInit() {
    this.serverService.getTicketPrices().subscribe(prices => this.ticketPrices = prices);
  }
}