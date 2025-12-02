import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Browser } from '@capacitor/browser';
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
  IonCheckbox,
  IonListHeader,
  IonRadioGroup,
  IonRadio
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, cardOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
// Reutilizamos la interfaz del user-home
import { CleanerService } from '../user-home/user-home.page';

@Component({
  selector: 'app-request-confirmation-modal',
  templateUrl: './request-confirmation-modal.component.html',
  styleUrls: ['./request-confirmation-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonSpinner, IonCheckbox, IonListHeader, IonRadioGroup, IonRadio]
})
export class RequestConfirmationModalComponent implements OnInit {
  @Input() cleaner?: any; // <-- Hacemos el cleaner opcional
  @Input() isBroadcast = false; // <-- Recibimos el nuevo flag
  @Input() services: CleanerService[] = [];
  @Input() userCoords!: L.LatLng; // <-- RECIBIMOS LAS COORDENADAS

  selectedServices: CleanerService[] = [];
  servicesTotalCost = 0;
  grandTotalCost = 0;
  isSubmitting = false;
  paymentMethod = 'cash';

  // Nuevas variables de estado para el flujo de verificación
  isWaitingForVerification = false;
  private paymentLinkIdForVerification: string | null = null;
  private originalReferenceForVerification: string | null = null;

  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);

  private customerApiUrl = 'http://localhost/php-api/api/customers/';
  // Reutilizamos el endpoint que creamos para el modal de filtro
  private allServicesApiUrl = `${environment.apiUrl}/common/get_all_services.php`;

  constructor() {
    addIcons({ close, cardOutline });
  }

  ngOnInit() {
    if (this.isBroadcast) {
      // Si es una solicitud a todos, cargamos todos los servicios maestros desde el backend.
      this.loadAllMasterServices();
    } else {
      // Si es para un cleaner específico, calculamos los costos con los servicios que ya nos pasaron.
      this.calculateCosts();
    }
  }

  onServiceSelectionChange(service: CleanerService, event: any) {
    if (event.detail.checked) {
      this.selectedServices.push(service);
    } else {
      this.selectedServices = this.selectedServices.filter(s => s.id !== service.id);
    }
    this.calculateCosts();
  }

  private loadAllMasterServices() {
    this.isSubmitting = true; // Usamos este flag para mostrar un spinner
    this.http.get<CleanerService[]>(this.allServicesApiUrl).subscribe({
      next: (allServices) => {
        // El backend ya nos devuelve 'service_name' y 'price' (como base_price).
        this.services = allServices;
        this.isSubmitting = false;
      },
      error: () => {
        this.showToast('No se pudieron cargar los servicios disponibles.', 'danger');
        this.isSubmitting = false;
      }
    });
  }

  private calculateCosts() {
    this.servicesTotalCost = this.selectedServices.reduce((total, service) => total + Number(service.price), 0);
    // El costo total ahora es simplemente el costo de los servicios.
    this.grandTotalCost = this.servicesTotalCost;
  }

  async confirmRequest() {
    // ¡SOLUCIÓN! Forzamos el recálculo del costo justo antes de cualquier acción.
    this.calculateCosts();

    if (this.selectedServices.length === 0) {
      this.showToast('Por favor, selecciona al menos un servicio.', 'warning');
      return;
    }

    if (this.paymentMethod === 'cash') {
      // Si es efectivo, creamos la solicitud directamente.
      this.createServiceRequest();
    } else if (this.paymentMethod === 'bold') {
      // Si es Bold, iniciamos el flujo de pago, pasando el costo actual.
      this.initiateBoldPayment(this.grandTotalCost);
    }
  }

  private async initiateBoldPayment(amountToPay: number) {
    this.isSubmitting = true;

    // 1. Genera una referencia ÚNICA para esta transacción. ¡Esto es crucial!
    const paymentReference = `SVC-REQ-${Date.now()}-${this.cleaner?.id}`;

    // 2. Prepara los datos para nuestro backend, que creará el link de Bold.
    const paymentData = {
      amount: amountToPay,
      reference: paymentReference,
      description: `Servicio de limpieza para ${this.cleaner?.name}`
    };

    // 3. Llama a un nuevo endpoint en nuestro backend para obtener el link de pago.
    this.http.post<{ payment_link_url: string, payment_link_id: string }>(`http://localhost/php-api/api/payments/create_bold_link.php`, paymentData).subscribe({
      next: async (response) => {
        const { payment_link_url: checkoutUrl, payment_link_id: paymentLinkId } = response;
        
        // Guardamos los datos necesarios para la verificación manual
        this.paymentLinkIdForVerification = paymentLinkId;
        this.originalReferenceForVerification = paymentReference;
        this.isWaitingForVerification = true; // Mostramos la nueva vista
        this.isSubmitting = false; // Detenemos el spinner del botón inicial

        await Browser.open({ url: checkoutUrl });
      },
      error: () => {
        this.showToast('No se pudo generar el link de pago. Intenta de nuevo.', 'danger');
        this.isSubmitting = false;
      }
    });
  }

  manualVerify() {
    if (this.paymentLinkIdForVerification && this.originalReferenceForVerification) {
      this.isSubmitting = true; // Activamos el spinner del botón "Verificar Pago"
      this.verifyBoldPayment(
        this.paymentLinkIdForVerification,
        this.originalReferenceForVerification
      );
    } else {
      this.showToast('Error: No se encontraron los datos de la transacción para verificar.', 'danger');
    }
  }

  cancelVerification() {
    this.isWaitingForVerification = false;
    this.paymentLinkIdForVerification = null;
    this.originalReferenceForVerification = null;
  }

  private verifyBoldPayment(paymentLinkId: string, originalReference: string) {
    // El navegador se cerró, ahora verificamos el estado del pago de forma segura en nuestro backend.
    this.http.post<{ status: string }>(`http://localhost/php-api/api/payments/verify_bold.php`, { payment_link_id: paymentLinkId }).subscribe({
      next: (response) => {
        if (response.status === 'PAID') { // El nuevo estado de éxito es 'PAID'
          // Si el pago fue aprobado, AHORA SÍ creamos la solicitud de servicio.
          this.showToast('¡Pago aprobado!', 'success');
          this.createServiceRequest(originalReference); // <-- ¡CORREGIDO! Usamos la referencia original
        } else {
          // Si el pago falló, fue rechazado o está pendiente, informamos al usuario.
          this.showToast(`El estado del pago es: ${response.status}. Por favor, intenta de nuevo.`, 'danger');
          this.isSubmitting = false;
        }
      },
      error: () => {
        this.showToast('Error al verificar el pago. Intenta de nuevo.', 'danger');
        this.isSubmitting = false;
      }
    });
  }

  private createServiceRequest(paymentReference?: string) {
    this.isSubmitting = true;

    // Verificamos que las coordenadas existan antes de enviar
    if (!this.userCoords) {
      this.showToast('Error: No se encontró la ubicación del usuario.', 'danger');
      this.isSubmitting = false;
      return;
    }

    const payload = {
      cleaner_id: this.cleaner ? this.cleaner.id : null, // <-- Si no hay cleaner, enviamos null
      selected_services: this.selectedServices,
      payment_method: this.paymentMethod,
      grand_total_cost: this.grandTotalCost, // <-- ¡DATO FALTANTE!
      payment_reference: this.paymentLinkIdForVerification || null,
      // ¡LA SOLUCIÓN! Añadimos las coordenadas con los nombres que el backend espera.
      latitude: String(this.userCoords.lat).replace(',', '.'),
      longitude: String(this.userCoords.lng).replace(',', '.')
    };

    // Decidimos a qué endpoint llamar
    const apiUrl = this.isBroadcast ? `${this.customerApiUrl}create_broadcast_request.php` : `${this.customerApiUrl}create_request.php`;

    this.http.post<{ message: string, request_id: number }>(apiUrl, payload).subscribe({
      next: async (res) => {
        await this.showToast('¡Solicitud enviada con éxito! Esperando la confirmación del limpiador.', 'success');
        this.modalCtrl.dismiss({ success: true, requestId: res.request_id });
      },
      error: async (err) => {
        console.error('Error al crear la solicitud:', err);
        await this.showToast('Hubo un error al enviar la solicitud. Inténtalo de nuevo.', 'danger');
        this.isSubmitting = false;
      }
    });
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}