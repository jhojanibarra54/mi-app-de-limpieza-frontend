import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
  IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';

export interface MasterService {
  id: number;
  name: string;
  description: string;
  base_price: number;
  offered?: boolean; // Propiedad opcional para el estado del toggle
}

@Component({
  selector: 'app-service-management-modal',
  templateUrl: './service-management-modal.component.html',
  styleUrls: ['./service-management-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonSpinner, IonToggle]
})
export class ServiceManagementModalComponent implements OnInit {
  masterServices: MasterService[] = [];
  isLoading = true;

  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);

  private apiUrl = 'http://localhost/php-api/api/cleaners/offered-services/';

  constructor() {
    addIcons({ close });
  }

  ngOnInit() {
    this.loadServices();
  }

  private loadServices() {
    this.isLoading = true;

    // Hacemos dos llamadas a la API en paralelo
    forkJoin({
      masterList: this.http.get<MasterService[]>(`${this.apiUrl}read_master_list.php`),
      offeredIds: this.http.get<number[]>(`${this.apiUrl}read_mine.php`)
    }).subscribe({
      next: ({ masterList, offeredIds }) => {
        const offeredIdSet = new Set(offeredIds);
        // Combinamos los datos: marcamos los servicios que el limpiador ya ofrece
        this.masterServices = masterList.map(service => ({
          ...service,
          offered: offeredIdSet.has(service.id)
        }));
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Error al cargar los servicios.', duration: 3000, color: 'danger' });
        await toast.present();
      }
    });
  }

  onServiceToggle(service: MasterService, event: any) {
    const offer = event.detail.checked;
    service.offered = offer; // Actualizamos el estado visualmente de inmediato
    this.http.post(`${this.apiUrl}toggle.php`, { master_service_id: service.id, offer }).subscribe();
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}