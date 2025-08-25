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
import { NotFoundComponent } from './not-found/not-found.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { PurchaseComponent } from './purchase/purchase.component'; 
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'repertoire', component: RepertoireComponent },
    { path: 'announcements', component: AnnouncementsComponent },
    { path: 'news', component: NewsComponent },
    { path: 'recommended', component: RecommendedComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'pricelist', component: PricelistComponent },
    { path: 'movie', component: MovieComponent },
    { path: 'movie/:id', component: MovieComponent },
    { path: 'not-found', component: NotFoundComponent },
    { path: 'user-profile', component: UserProfileComponent, canActivate: [() => {
        const auth = inject(AuthService);
        const router = inject(Router);
        return auth.isLoggedIn().pipe(
          map(ok => ok ? true : router.createUrlTree(['/login']))
        );
    }] },
    { path: 'payment-success', component: PaymentSuccessComponent },
    { path: 'purchase/:id', component: PurchaseComponent, canActivate: [() => {
        const auth = inject(AuthService);
        const router = inject(Router);
        return auth.isLoggedIn().pipe(
          map(ok => ok ? true : router.createUrlTree(['/login']))
        );
    }] },
    { path: '**', redirectTo: 'not-found' }
];
