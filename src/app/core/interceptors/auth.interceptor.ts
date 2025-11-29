import { HttpInterceptorFn } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { from, switchMap } from 'rxjs';

const TOKEN_KEY = 'my-auth-token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Usamos `from` para convertir la Promesa de Preferences en un Observable
  return from(Preferences.get({ key: TOKEN_KEY })).pipe(
    switchMap(tokenData => {
      if (tokenData && tokenData.value) {
        // El valor guardado es un string JSON, así que lo parseamos.
        // El token real está dentro de la propiedad 'token' del objeto parseado.
        let token = null;
        try {
          token = JSON.parse(tokenData.value).token;
        } catch (e) {
          // Si el valor no es un JSON válido, continuamos sin token.
        }
        if (!token) {
          return next(req);
        }
        // Clonamos la petición y añadimos el encabezado de autorización
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(authReq);
      }
      // Si no hay token, continuamos con la petición original
      return next(req);
    })
  );
};