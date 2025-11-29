import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUserRole().pipe(
    take(1), // Tomamos solo el primer valor emitido para evitar suscripciones abiertas
    map(role => {
      // Si el rol es 'admin', permitimos el acceso
      if (role === 'admin') {
        return true;
      }
      // Si no, redirigimos al login y denegamos el acceso
      return router.createUrlTree(['/login']);
    })
  );
};