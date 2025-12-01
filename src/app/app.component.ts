/**
 * Título: Lógica del Componente Raíz de la Aplicación (app.component.ts)
 * Descripción:
 * Este archivo contiene la lógica principal para el componente raíz de la aplicación (AppComponent).
 * Es el "cerebro" detrás de la plantilla `app.component.html`. Sus responsabilidades incluyen:
 * - Definir la estructura de datos para el menú de navegación lateral.
 * - Manejar la inyección de servicios clave como autenticación y controladores de modales/menú.
 * - Implementar las funciones para acciones globales como "Cerrar Sesión" y "Editar Perfil".
 * - Registrar los íconos que se usarán en toda la aplicación.
 */

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, ModalController, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, logOutOutline, listOutline, buildOutline, receiptOutline, chatbubblesOutline } from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';
import { EditProfileModalComponent } from './features/edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-root', // El selector CSS para usar este componente (se usa en index.html).
  templateUrl: 'app.component.html', // La plantilla HTML asociada a este componente.
  styleUrls: ['app.component.scss'], // Las hojas de estilo específicas para este componente.
  standalone: true, // Indica que es un componente autónomo (no necesita un NgModule).
  // Importa todos los módulos y componentes necesarios para que la plantilla funcione.
  imports: [RouterLink, RouterLinkActive, CommonModule, IonApp, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle],
})
export class AppComponent {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  // `inject()` es la forma moderna en Angular de obtener instancias de servicios.

  // Servicio de autenticación: Proporciona información sobre el usuario actual (nombre, rol) y maneja el login/logout.
  public authService = inject(AuthService);
  // Controlador de modales: Permite crear y mostrar ventanas modales (pop-ups).
  private modalCtrl = inject(ModalController);
  // Controlador de menú: Permite controlar el menú lateral mediante programación (aunque no se usa activamente aquí, es bueno tenerlo).
  private menuCtrl = inject(MenuController);

  // --- DEFINICIÓN DE LAS PÁGINAS DEL MENÚ ---
  // Este array de objetos define las opciones que aparecerán en el menú lateral.
  // La plantilla `app.component.html` itera sobre este array para generar los enlaces.
  public appPages = [
    // Cada objeto representa un enlace en el menú.
    // `roles`: Es la clave. Define qué roles de usuario pueden ver este enlace ('user' o 'cleaner').
    { title: 'Convertirse en Limpiador', url: '/become-cleaner', icon: 'build', roles: ['user'] },
    { title: 'Mensajes', url: '/user-messages', icon: 'chatbubbles', roles: ['user'] },
    { title: 'Historial de Servicios', url: '/cleaner-history', icon: 'receipt', roles: ['cleaner'] },
    { title: 'Mensajes', url: '/cleaner-messages', icon: 'chatbubbles', roles: ['cleaner'] },
  ];

  /**
   * El constructor se ejecuta una sola vez cuando se crea el componente.
   * Su principal responsabilidad aquí es registrar globalmente los íconos de Ionicons
   * para que puedan ser utilizados en cualquier parte de la aplicación mediante la etiqueta <ion-icon>.
   */
  constructor() {
    addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, logOutOutline, personCircleOutline, listOutline, buildOutline, receiptOutline, chatbubblesOutline });
  }

  /**
   * Ejecuta el proceso de cierre de sesión.
   * Llama al método `logout()` del servicio de autenticación, que se encargará de
   * limpiar el token de sesión y redirigir al usuario a la página de login.
   */
  logout() {
    this.authService.logout();
  }

  /**
   * Crea y muestra una ventana modal para editar el perfil del usuario.
   * Es una función asíncrona porque la creación y presentación del modal son operaciones que pueden tomar un momento.
   */
  async editProfile() {
    // Crea el modal usando el componente `EditProfileModalComponent`.
    const modal = await this.modalCtrl.create({
      component: EditProfileModalComponent,
    });
    // Muestra el modal al usuario.
    await modal.present();
  }
}
