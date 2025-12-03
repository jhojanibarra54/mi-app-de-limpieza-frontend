import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonTextarea, IonButton, ToastController, LoadingController } from '@ionic/angular/standalone';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-become-cleaner',
  templateUrl: './become-cleaner.page.html',
  styleUrls: ['./become-cleaner.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonTextarea, IonButton]
})
export class BecomeCleanerPage {
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  private apiUrl = 'http://localhost/php-api/api/customers/apply_to_be_cleaner.php';

  public selectedFile: File | null = null;
  public message = '';
  public fileName = '';

  constructor() { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
    }
  }

  async submitApplication() {
    if (!this.selectedFile) {
      this.presentToast('Por favor, selecciona un documento de identidad.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Enviando solicitud...' });
    await loading.present();

    const formData = new FormData();
    formData.append('document', this.selectedFile, this.selectedFile.name);
    formData.append('message', this.message);

    this.http.post<{ message: string }>(this.apiUrl, formData).subscribe({
      next: (res) => {
        loading.dismiss();
        this.presentToast(res.message, 'success');
        // Opcional: Redirigir al usuario o deshabilitar el formulario
      },
      error: (err: HttpErrorResponse) => {
        loading.dismiss();
        const errorMessage = err.error?.message || 'Ocurrió un error al enviar la solicitud.';
        this.presentToast(errorMessage, 'danger');
      }
    });
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    await toast.present();
  }
}
