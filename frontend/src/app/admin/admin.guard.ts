import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.getUser().pipe(
    map(user => {
      if (user && user.is_admin) {
        return true;
      }
      return router.createUrlTree(['/']);
    }),
    catchError(() => of(router.createUrlTree(['/'])))
  );
};
