import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; 
import { RepertoireComponent } from './repertoire/repertoire.component';
import { AnnouncementsComponent } from './announcements/announcements.component';
import { NewsComponent } from './news/news.component';
import { RecommendedComponent } from './recommended/recommended.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PricelistComponent } from './pricelist/pricelist.component';
import { MovieComponent } from './movie/movie.component'; 

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'repertoire', component: RepertoireComponent },
    { path: 'announcements', component: AnnouncementsComponent },
    { path: 'news', component: NewsComponent },
    { path: 'recommended', component: RecommendedComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'pricelist', component: PricelistComponent },
    { path: 'movie/:id', component: MovieComponent }, 
    { path: '**', redirectTo: '' }
];
