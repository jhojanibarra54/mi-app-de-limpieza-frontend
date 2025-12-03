/**
 * Título: Configuración Principal de la Aplicación (app.config.ts)
 * Descripción:
 * Este archivo define la configuración central para toda la aplicación Angular.
 * En las aplicaciones modernas basadas en componentes "standalone", este archivo reemplaza
 * al tradicional `app.module.ts`. Aquí se configuran los proveedores de servicios
 * globales, las rutas, el cliente HTTP, la internacionalización y más.
 */

import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules, withHashLocation } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
// Importa los datos de localización específicos para Español (Colombia),
// que incluyen formatos de fecha, moneda, números, etc.
import localeEsCo from '@angular/common/locales/es-CO';

// Importa la definición de las rutas de la aplicación desde `app.routes.ts`.
import { routes } from './app.routes';
// Importa el interceptor de autenticación, que añadirá el token JWT a las peticiones HTTP.
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Registra globalmente los datos de localización para 'es-CO'.
// Esto permite que Angular sepa cómo formatear fechas y números según las convenciones colombianas.
registerLocaleData(localeEsCo);

// `appConfig` es el objeto de configuración que se pasa al arrancar la aplicación en `main.ts`.
export const appConfig: ApplicationConfig = {
  // `providers` es un array donde se registran todos los servicios y configuraciones globales.
  providers: [
    // 1. Configuración de Internacionalización (i18n):
    // Establece 'es-CO' como el identificador de localización (locale) por defecto para toda la aplicación.
    { provide: LOCALE_ID, useValue: 'es-CO' },

    // 2. Configuración de Rutas de Ionic:
    // Define la estrategia de reutilización de rutas de Ionic para una experiencia de navegación similar a la nativa (caching de páginas).
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // 3. Inicialización de Ionic y Angular:
    provideIonicAngular({}),
    provideRouter(routes, withPreloading(PreloadAllModules), withHashLocation()), // Configura el enrutador de Angular con las rutas definidas y una estrategia de precarga de módulos para mejorar el rendimiento.
    provideHttpClient(withInterceptors([authInterceptor])), // Configura el cliente HTTP con el interceptor de autenticación.
    // 4. Configuración del Cliente HTTP:
    // Habilita el servicio HttpClient y registra el `authInterceptor`.
    // Esto significa que cada petición HTTP que se haga en la app pasará automáticamente por el interceptor.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
