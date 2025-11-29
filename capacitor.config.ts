import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Mi App de Limpieza',
  webDir: 'www',
  server: {
    // Reemplaza con la IP de tu máquina si pruebas en un dispositivo físico
    url: 'http://localhost/php-api',
    cleartext: true
  }
};

export default config;
