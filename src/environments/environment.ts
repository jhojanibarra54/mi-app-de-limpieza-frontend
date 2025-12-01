/**
 * Título: Configuración del Entorno de Desarrollo (environment.ts)
 * Descripción:
 * Este archivo contiene las variables de configuración específicas para el entorno de desarrollo local.
 * Durante el proceso de compilación para producción (`ng build`), Angular reemplaza automáticamente
 * este archivo por `environment.prod.ts`. Esto permite tener diferentes configuraciones
 * (como la URL de la API) para desarrollo y producción sin tener que cambiar el código.
 */

export const environment = {
   /**
   * `production`: Un booleano que indica si la aplicación se está ejecutando en modo de producción.
   * En este archivo, siempre es `false`. En `environment.prod.ts`, es `true`.
   * Se puede usar en el código (ej: `if (!environment.production) { ... }`) para ejecutar lógica solo en desarrollo.
   */
  production: false,

  /**
   * `apiUrl`: La URL base del backend (API) para el entorno de desarrollo.
   * Apunta a un servidor local (localhost) para que la aplicación frontend pueda comunicarse
   * con la API que se ejecuta en la misma máquina. En el archivo `environment.prod.ts`,
   * esta URL apuntaría al servidor de producción real (ej: 'https://api.miapp.com/api').
   */
  apiUrl: 'http://localhost/php-api/api'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
