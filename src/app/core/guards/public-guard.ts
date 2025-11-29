import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take, switchMap, of } from 'rxjs';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getIsAuthenticated().pipe(
    filter(isAuthenticated => isAuthenticated !== null),
    take(1),
    switchMap(isAuthenticated => {
      if (isAuthenticated) {
        // Si el usuario ya está autenticado, lo redirigimos a su dashboard
        return authService.getCurrentUserRole().pipe(
          take(1),
          map(role => {
            if (role === 'cleaner') {
              router.navigateByUrl('/cleaner-home', { replaceUrl: true });
            } else if (role === 'admin') {
              router.navigateByUrl('/admin-approvals', { replaceUrl: true });
            } else {
              router.navigateByUrl('/user-home', { replaceUrl: true });
            }
            // Bloqueamos el acceso a la ruta pública (login/register)
            return false;
          })
        );
      } else {
        // Si no está autenticado, permitimos el acceso a la ruta pública
        return of(true);
      }
    })
  );
};
