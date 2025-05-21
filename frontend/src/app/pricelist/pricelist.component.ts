import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-pricelist',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './pricelist.component.html',
  styles: ``,
})
export class PricelistComponent {
  pricelist = [
    {
      type: 'Bilet normalny',
      prices: {
        cheapThursday: '20 PLN',
        threeDaysBefore: '22 PLN',
        twoDaysBefore: '23 PLN',
        oneDayBefore: '24 PLN',
        sameDay: '25 PLN',
      },
    },
    {
      type: 'Bilet ulgowy',
      prices: {
        cheapThursday: '15 PLN',
        threeDaysBefore: '17 PLN',
        twoDaysBefore: '18 PLN',
        oneDayBefore: '19 PLN',
        sameDay: '20 PLN',
      },
    },
    {
      type: 'Bilet rodzinny (2+2)',
      prices: {
        cheapThursday: '60 PLN',
        threeDaysBefore: '65 PLN',
        twoDaysBefore: '68 PLN',
        oneDayBefore: '70 PLN',
        sameDay: '75 PLN',
      },
    },
    {
      type: 'Bilet studencki',
      prices: {
        cheapThursday: '14 PLN',
        threeDaysBefore: '16 PLN',
        twoDaysBefore: '17 PLN',
        oneDayBefore: '18 PLN',
        sameDay: '18 PLN',
      },
    },
    {
      type: 'Bilet seniora',
      prices: {
        cheapThursday: '12 PLN',
        threeDaysBefore: '13 PLN',
        twoDaysBefore: '14 PLN',
        oneDayBefore: '15 PLN',
        sameDay: '15 PLN',
      },
    },
  ];
}