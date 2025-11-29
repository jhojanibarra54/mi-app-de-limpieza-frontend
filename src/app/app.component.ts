import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, ModalController, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, logOutOutline, listOutline, buildOutline, receiptOutline, chatbubblesOutline } from 'ionicons/icons';
import { AuthService } from './core/services/auth.service'; 
import { EditProfileModalComponent } from './features/edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, IonApp, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle]
})
export class AppComponent {
  public authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private menuCtrl = inject(MenuController);

  public appPages = [
    { title: 'Convertirse en Limpiador', url: '/become-cleaner', icon: 'build', roles: ['user'] },
    { title: 'Mensajes', url: '/user-messages', icon: 'chatbubbles', roles: ['user'] },
    { title: 'Historial de Servicios', url: '/cleaner-history', icon: 'receipt', roles: ['cleaner'] },
    { title: 'Mensajes', url: '/cleaner-messages', icon: 'chatbubbles', roles: ['cleaner'] },
    // La opción 'Mis Servicios' fue movida a la cabecera de cleaner-home, por lo que se elimina de aquí.
  ];

  constructor() {
    addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, logOutOutline, personCircleOutline, listOutline, buildOutline, receiptOutline, chatbubblesOutline });
  }

  logout() {
    this.authService.logout();
  }

  async editProfile() {
    const modal = await this.modalCtrl.create({
      component: EditProfileModalComponent,
    });
    await modal.present();
  }
}
