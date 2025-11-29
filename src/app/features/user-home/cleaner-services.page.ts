import { Component, inject, OnInit } from '@angular/core';
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
  IonCheckbox,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  ToastController
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PlatformService {
  id: number;
  name: string;
  description: string;
  is_selected: boolean;
}

@Component({
  selector: 'app-cleaner-services',
  templateUrl: './cleaner-services.page.html',
  styleUrls: ['./cleaner-services.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonCheckbox, IonButtons, IonBackButton, IonSpinner, IonButton]
})
export class CleanerServicesPage implements OnInit {
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private apiUrl = `${environment.apiUrl}/cleaners/services.php`;

  public services: PlatformService[] = [];
  public isLoading = true;

  constructor() { }

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.isLoading = true;
    // Usamos forkJoin para hacer ambas llamadas a la vez
    forkJoin({
      allServices: this.http.get<any[]>(this.apiUrl),
      myServices: this.http.get<any[]>(`${this.apiUrl}?my_services=true`)
    }).subscribe({
      next: ({ allServices, myServices }) => {
        const myServiceIds = new Set(myServices.map(s => s.id));
        this.services = allServices.map(service => ({
          ...service,
          is_selected: myServiceIds.has(service.id)
        }));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  async saveChanges() {
    const selectedServiceIds = this.services.filter(s => s.is_selected).map(s => s.id);
    this.http.post(this.apiUrl, { service_ids: selectedServiceIds }).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Servicios actualizados con éxito.', duration: 2000, color: 'success' });
        await toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Error al guardar los servicios.', duration: 2000, color: 'danger' });
        await toast.present();
      }
    });
  }
}
