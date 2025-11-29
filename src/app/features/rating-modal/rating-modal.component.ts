import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
  ToastController,
  IonSpinner,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, star, starOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.component.html',
  styleUrls: ['./rating-modal.component.scss'],
  standalone: true, // IonList and IonLabel are not used in the template
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButtons, IonButton, IonIcon, IonSpinner, IonTextarea]
})
export class RatingModalComponent {
  @Input() serviceRequest: any;

  rating = 0;
  comment = '';
  isSubmitting = false;

  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);

  private apiUrl = 'http://localhost/php-api/api/customers/submit_rating.php';

  constructor() {
    addIcons({ close, star, starOutline });
  }

  setRating(value: number) {
    this.rating = value;
  }

  async submitRating() {
    if (this.rating === 0) {
      this.presentToast('Por favor, selecciona una calificación de estrellas.', 'warning');
      return;
    }

    this.isSubmitting = true;
    const payload = {
      request_id: this.serviceRequest.id,
      rating: this.rating,
      comment: this.comment
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: async () => {
        await this.presentToast('¡Gracias por tu calificación!', 'success');
        this.modalCtrl.dismiss({ rated: true });
      },
      error: async () => {
        await this.presentToast('Error al enviar la calificación.', 'danger');
        this.isSubmitting = false;
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}