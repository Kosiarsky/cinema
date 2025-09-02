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
import { adminGuard } from './admin/admin.guard';
import { AdminComponent } from './admin/admin.component';
import { MoviesAdminComponent } from './admin/movies/movies-admin.component';
import { SchedulesAdminComponent } from './admin/schedules/schedules-admin.component';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { UsersAdminComponent } from './admin/users/users-admin.component';
import { MovieAddComponent } from './admin/movies/movie-add.component';
import { SlidesAdminComponent } from './admin/slides/slides-admin.component';
import { NewsAdminComponent } from './admin/news/news-admin.component';
import { NewsDetailComponent } from './news/news-detail.component';
import { PricesAdminComponent } from './admin/prices/prices-admin.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'repertoire', component: RepertoireComponent },
    { path: 'announcements', component: AnnouncementsComponent },
    { path: 'news', component: NewsComponent },
    { path: 'news/:id', component: NewsDetailComponent },
    { path: 'recommended', component: RecommendedComponent },
    { path: 'login', component: LoginComponent, canActivate: [() => {
        const auth = inject(AuthService);
        const router = inject(Router);
        return auth.isLoggedIn().pipe(
          map(ok => ok ? router.createUrlTree(['/']) : true)
        );
    }] },
    { path: 'register', component: RegisterComponent, canActivate: [() => {
        const auth = inject(AuthService);
        const router = inject(Router);
        return auth.isLoggedIn().pipe(
          map(ok => ok ? router.createUrlTree(['/']) : true)
        );
    }] },
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
    { path: 'admin', component: AdminComponent, canActivate: [adminGuard], children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'movies/add', component: MovieAddComponent },
      { path: 'movies', component: MoviesAdminComponent },
      { path: 'schedules', component: SchedulesAdminComponent },
      { path: 'users', component: UsersAdminComponent },
      { path: 'slides', component: SlidesAdminComponent },
      { path: 'news', component: NewsAdminComponent },
      { path: 'prices', component: PricesAdminComponent },
    ] },
    { path: '**', redirectTo: 'not-found' }
];
