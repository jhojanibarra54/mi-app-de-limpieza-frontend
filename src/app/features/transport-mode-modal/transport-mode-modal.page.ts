import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonRadioGroup,
  IonListHeader,
  IonLabel,
  IonItem,
  IonRadio,
  IonButton,
  IonButtons,
  ModalController
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-transport-mode-modal', // El selector está bien
  templateUrl: './transport-mode-modal.page.html', // Corregido para apuntar al .page.html
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonRadioGroup, IonListHeader, IonLabel, IonItem, IonRadio, IonButton, IonButtons]
})
export class TransportModeModalPage { // Corregido el nombre de la clase
  public transportMode = 'driving';

  private modalCtrl = inject(ModalController);

  confirm() {
    // Al confirmar, cerramos el modal y devolvemos el modo seleccionado
    this.modalCtrl.dismiss(this.transportMode, 'confirm');
  }

  cancel() {
    // Si cancela, no devolvemos nada
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
