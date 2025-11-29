import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButton, IonIcon, IonButtons, IonBackButton, AlertController, ToastController, IonNote } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, closeCircleOutline } from 'ionicons/icons';

interface UserService {
  id: number;
  status: 'pending' | 'accepted';
  cleaner_name: string;
  grand_total_cost: number;
  created_at: string;
}

@Component({
  selector: 'app-user-services',
  templateUrl: './user-services.page.html',
  styleUrls: ['./user-services.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButton, IonIcon, IonButtons, IonBackButton, IonNote]
})
export class UserServicesPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  private apiUrl = 'http://localhost/php-api/api/customers/';

  public services: UserService[] = [];
  public isLoading = true;

  constructor() {
    addIcons({ eyeOutline, closeCircleOutline });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadServices();
  }

  loadServices() {
    this.isLoading = true;
    this.http.get<UserService[]>(`${this.apiUrl}get_my_services.php`).subscribe({
      next: (data) => {
        this.services = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Manejar error si es necesario
      }
    });
  }

  async confirmCancel(serviceId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Cancelación',
      message: '¿Estás seguro de que quieres cancelar esta solicitud?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, Cancelar',
          handler: () => this.cancelService(serviceId)
        }
      ]
    });
    await alert.present();
  }

  private cancelService(serviceId: number) {
    this.http.post(`${this.apiUrl}cancel_service.php`, { request_id: serviceId }).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Solicitud cancelada.', duration: 2000, color: 'success' });
        await toast.present();
        this.loadServices(); // Recargamos la lista
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'No se pudo cancelar la solicitud.', duration: 3000, color: 'danger' });
        await toast.present();
      }
    });
  }

  viewTracking(serviceId: number) {
    // Navegamos a la página principal, que ya tiene la lógica para mostrar el seguimiento
    this.router.navigateByUrl('/user-home');
  }
}
