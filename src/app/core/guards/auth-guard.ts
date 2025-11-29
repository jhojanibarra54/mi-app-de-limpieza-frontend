import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getIsAuthenticated().pipe(
    // Esperamos hasta que el estado de autenticación no sea nulo
    // (es decir, hasta que loadToken() haya terminado en el servicio)
    filter(isAuthenticated => isAuthenticated !== null),
    take(1), // Tomamos solo el primer valor emitido para no dejar la suscripción abierta
    map(isAuthenticated => {
      if (isAuthenticated) {
        // Si está autenticado, permite el acceso a la ruta
        return true;
      } else {
        // Si no está autenticado, redirige a la página de login
        router.navigateByUrl('/login');
        return false;
      }
    })
  );
};
