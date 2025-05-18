import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; 
import { RepertoireComponent } from './repertoire/repertoire.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'repertoire', component: RepertoireComponent },
];
