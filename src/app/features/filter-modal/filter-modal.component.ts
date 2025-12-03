import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, ModalController, IonRadioGroup, IonRadio, IonListHeader, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


// Interfaz para los servicios
export interface Service {
  id: number;
  service_name: string;
}

@Component({
  selector: 'app-filter-modal',
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonRadioGroup, IonRadio, IonListHeader, IonSpinner]
})
export class FilterModalComponent implements OnInit {
  
  public services: Service[] = [];
  public selectedServiceId: number | null = null;
  public isLoading = true;

  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  // NOTA: Necesitarás crear este endpoint en tu backend.
  private servicesApiUrl = `${environment.apiUrl}/common/get_all_services.php`;

  constructor() {
    addIcons({ close });
  }

  ngOnInit() {
    this.loadAllServices();
  }

  loadAllServices() {
    this.isLoading = true;
    this.http.get<Service[]>(this.servicesApiUrl).subscribe({
      next: (data) => {
        this.services = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Opcional: mostrar un error si no se pueden cargar los servicios.
      }
    });
  }

  applyFilter() {
    // Devolvemos el ID del servicio seleccionado
    this.modalCtrl.dismiss({ serviceId: this.selectedServiceId }, 'confirm');
  }

  clearFilter() {
    // Devolvemos null para indicar que se debe limpiar el filtro
    this.modalCtrl.dismiss({ serviceId: null }, 'confirm');
  }

  closeModal() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
