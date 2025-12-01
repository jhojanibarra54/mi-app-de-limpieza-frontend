/**
 * Título: Pruebas Unitarias para AppComponent (app.component.spec.ts)
 * Descripción:
 * Este archivo contiene las pruebas unitarias para el componente raíz `AppComponent`.
 * Su propósito es verificar que el componente se comporte como se espera de forma aislada.
 * Estas pruebas son herramientas para el desarrollador y no se incluyen en la aplicación final
 * que ve el usuario. Ayudan a garantizar la calidad y a prevenir errores futuros.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

// `describe` define un "conjunto de pruebas" (test suite) para un componente o servicio específico.
describe('AppComponent', () => {
  // `it` define una prueba individual dentro del conjunto. La descripción explica qué se está probando.
  it('should create the app', async () => {
    // `TestBed` es la principal utilidad de Angular para configurar un entorno de pruebas.
    // Es como un módulo de Angular temporal, específico para esta prueba.
    await TestBed.configureTestingModule({
      // `imports`: Importa el componente que vamos a probar.
      imports: [AppComponent],
      // `providers`: Proporciona las dependencias que el componente necesita, como el Router.
      // `provideRouter([])` simula el sistema de rutas de Angular para que el componente no falle.
      providers: [provideRouter([])]
    }).compileComponents();
    
    // Crea una instancia del componente dentro del entorno de pruebas.
    const fixture = TestBed.createComponent(AppComponent);
    // Obtiene la instancia de la clase del componente para poder interactuar con ella.
    const app = fixture.componentInstance;
    // `expect` es la aserción de la prueba. Aquí, se verifica que la instancia del componente (`app`) se haya creado correctamente (que no sea nula o indefinida).
    expect(app).toBeTruthy();
  });
});
