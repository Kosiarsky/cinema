import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [ CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './not-found.component.html',
  styles: ``
})
export class NotFoundComponent {

}
