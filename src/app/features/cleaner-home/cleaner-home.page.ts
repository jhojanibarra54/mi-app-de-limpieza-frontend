import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  ToastController,
  LoadingController,
  ModalController,
  IonMenuButton,
  AlertController,
  IonInput,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone'; // Se eliminó ApiService de aquí si estaba
import { addIcons } from 'ionicons';
import { logOutOutline, listOutline, navigateOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Subscription, interval } from 'rxjs';
import { ServiceManagementModalComponent } from '../service-management-modal/service-management-modal.component';
import { TransportModeModalPage } from '../transport-mode-modal/transport-mode-modal.page';
import { BankDetailsModalPage } from '../bank-details-modal/bank-details-modal.page';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment'; 

const LOCATION_UPDATE_INTERVAL = 15000; // 15 segundos
const REQUEST_POLLING_INTERVAL = 7000;  // 7 segundos


export interface ServiceRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_latitude: number;
  user_longitude: number;
  grand_total_cost: number;
  created_at: string;
}

export interface CleanerProfile {
  name: string;
  email: string;
  wallet_balance: number;
}

@Component({
  selector: 'app-cleaner-home',
  templateUrl: './cleaner-home.page.html',
  styleUrls: ['./cleaner-home.page.scss'],
  standalone: true, // BankDetailsModalPage se añade a imports en su propio archivo
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule, RouterLink, IonMenuButton, CurrencyPipe, TransportModeModalPage, IonInput, IonGrid, IonRow, IonCol, BankDetailsModalPage]
})
export class CleanerHomePage implements OnInit, OnDestroy {
  public isConnected = false;
  public pendingRequest: ServiceRequest | null = null;
  public broadcastRequests: ServiceRequest[] = []; // <-- NUEVA PROPIEDAD
  public activeService: ServiceRequest | null = null;
  public profile: CleanerProfile | null = null;
  public cleanerName: string | null = null;
  public eta: string | null = null; // Added for the 'accepted' state in the template
  public serviceStatus: 'idle' | 'waiting_for_request' | 'browsing_broadcast' | 'accepted' | 'pending_verification' | 'in_progress' = 'idle'; // <-- NUEVO ESTADO
  public pinValue: string = '';
  private locationUpdateSubscription?: Subscription;
  private requestPollingSubscription?: Subscription;

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  private updateLocationApiUrl = `${environment.apiUrl}/cleaners/update-location.php`;
  private profileApiUrl = `${environment.apiUrl}/cleaners/get_profile.php`;
  private transportModeApiUrl = `${environment.apiUrl}/cleaners/set_transport_mode.php`;
  private requestApiUrl = `${environment.apiUrl}/cleaners/requests/`;

  constructor() {
    addIcons({listOutline,logOutOutline, navigateOutline});
    this.authService.getCurrentUserName().subscribe(name => {
      this.cleanerName = name;
    });
  }

  async ngOnInit() {
    // Nos suscribimos al estado de conexión del AuthService
    this.authService.isCleanerConnected$.subscribe((isConnected: boolean) => {
      this.isConnected = isConnected;
      if (isConnected) {
        this.checkForActiveService();
        this.startLocationUpdates();
        this.startPollingForRequests();
      }
      else {
        // If disconnected, reset service states
        this.pendingRequest = null;
        this.activeService = null;
        this.serviceStatus = 'idle';
      }
    });
  }

  ionViewWillEnter() {
    // Recargamos el perfil cada vez que el usuario entra a la vista
    // para tener el saldo de la billetera actualizado.
    this.loadProfile();
  }

  ngOnDestroy() {
    this.stopLocationUpdates();
    this.stopPollingForRequests();
  }

  private async presentTransportModeModal(): Promise<string | null> {
    const modal = await this.modalCtrl.create({
      component: TransportModeModalPage,
      backdropDismiss: false // Evita que se cierre al hacer clic fuera
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      return data; // Devuelve el modo de transporte ('driving', 'walking', etc.)
    }
    return null; // El usuario canceló
  }

  async toggleConnection() {
    const newState = !this.isConnected;

    // Primero, actualizamos la ubicación si nos estamos conectando
    if (newState) {
      // 1. Preguntar por el modo de transporte
      const transportMode = await this.presentTransportModeModal();
      if (!transportMode) {
        return; // El usuario canceló la selección, no continuamos.
      }

      // 2. AHORA SÍ, mostramos el "cargando"
      const loading = await this.loadingCtrl.create({ message: 'Conectando...' });
      await loading.present();

      const handleSuccess = () => {
        this.startLocationUpdates();
        this.checkForActiveService();
        this.startPollingForRequests();
        loading.dismiss();
      };

      const handleError = (err: any) => {
        this.authService.setCleanerConnectionStatus(!newState).subscribe();
        this.handleConnectionError(err, loading);
      };

      try {
        // 3. Guardar el modo de transporte en el backend
        await this.http.post(this.transportModeApiUrl, { transport_mode: transportMode }).toPromise();

        // 4. Obtener y actualizar ubicación
        const position = await Geolocation.getCurrentPosition();
        await this.http.post(this.updateLocationApiUrl, { latitude: position.coords.latitude, longitude: position.coords.longitude }).toPromise();

        // 5. Finalmente, cambiar el estado de conexión
        this.authService.setCleanerConnectionStatus(true).subscribe({
          next: handleSuccess,
          error: handleError
        });
      } catch (e) {
        this.handleConnectionError(e, loading, 'No se pudo obtener la ubicación. Activa el GPS.');
      }
    } else {
      // Si nos desconectamos, el flujo original está bien.
      const loading = await this.loadingCtrl.create({ message: 'Desconectando...' });
      await loading.present();
      const handleSuccess = () => {
        this.stopLocationUpdates();
        this.stopPollingForRequests();
        this.pendingRequest = null; // Clear pending request on disconnect
        this.activeService = null; // Clear active service on disconnect
        this.serviceStatus = 'idle'; // Reset service status
        loading.dismiss();
      };
      const handleError = (err: any) => {
        this.authService.setCleanerConnectionStatus(!newState).subscribe();
        this.handleConnectionError(err, loading);
      };
      // Si nos desconectamos, simplemente llamamos al servicio
      this.authService.setCleanerConnectionStatus(false).subscribe({ next: handleSuccess, error: handleError });
    }
  }

  private async handleConnectionError(error: any, loading: HTMLIonLoadingElement, customMessage?: string) {
    loading.dismiss();
    const toast = await this.toastCtrl.create({ message: customMessage || 'Error al cambiar de estado.', duration: 3000, color: 'danger' });
    await toast.present();
  }

  loadProfile() {
    this.http.get<CleanerProfile>(this.profileApiUrl).subscribe(profile => {
      this.profile = profile;
    });
  }

  async manageServices() {
    const modal = await this.modalCtrl.create({
      component: ServiceManagementModalComponent,
    });
    await modal.present();
  }

  startLocationUpdates() {
    // Enviamos la ubicación cada 15 segundos
    this.locationUpdateSubscription = interval(LOCATION_UPDATE_INTERVAL).subscribe(async () => {
      try { // Added try-catch for Geolocation
        const position = await Geolocation.getCurrentPosition();
        this.http.post(this.updateLocationApiUrl, { latitude: position.coords.latitude, longitude: position.coords.longitude }).subscribe({
          error: (err) => console.error('Error updating location:', err) // Log error but don't stop updates
        });
      } catch (e) {
        console.error('Error getting current position for update:', e);
      }
    });
  }

  stopLocationUpdates() {
    this.locationUpdateSubscription?.unsubscribe();
  }

  private startPollingForRequests() {
    this.stopPollingForRequests(); // Nos aseguramos de que no haya una suscripción anterior.
    // Pregunta por nuevas solicitudes cada 7 segundos
    this.requestPollingSubscription = interval(REQUEST_POLLING_INTERVAL).subscribe(() => {      
      if (!this.pendingRequest && !this.activeService) { // Solo buscamos si no hay nada pendiente o activo        
        // 1. Buscar solicitudes directas
        this.http.get<ServiceRequest | null>(`${this.requestApiUrl}get_pending.php`).subscribe(request => {
          if (request) {
            this.pendingRequest = request;
            this.serviceStatus = 'waiting_for_request'; // Update service status
            this.broadcastRequests = []; // Limpiamos las broadcast si llega una directa
          }
        });

        // 2. Si no hay solicitud directa, buscar solicitudes broadcast
        if (!this.pendingRequest) {
          this.http.get<ServiceRequest[]>(`${this.requestApiUrl}get_broadcast_requests.php`).subscribe(requests => {
            this.broadcastRequests = requests;
            if (requests.length > 0) {
              this.serviceStatus = 'browsing_broadcast';
            } else if (this.serviceStatus === 'browsing_broadcast') {
              // Si estábamos viendo broadcasts y ya no hay, volvemos a idle
              this.serviceStatus = 'idle';
            }
          });
        }
      }
    });
  }

  private checkForActiveService() {
    this.http.get<ServiceRequest | null>(`${this.requestApiUrl}get_active.php`).subscribe(service => {
      if (service) {
        // La respuesta de get_active.php ahora puede tener múltiples estados
        this.activeService = service;
        // Forzamos el tipo para acceder a la propiedad 'status' que sabemos que viene del backend
        const serviceWithStatus = service as any;

        if (serviceWithStatus.status === 'in_progress') {
          this.serviceStatus = 'in_progress';
        } else {
          // Si no es 'in_progress', asumimos que es 'accepted' (en camino)
          this.serviceStatus = 'accepted';
          this.eta = '5 min'; // Placeholder para el ETA
        }
      } else if (this.activeService && this.serviceStatus !== 'idle') {
        this.activeService = null;
        this.serviceStatus = 'idle';
      }
    });
  }

  private stopPollingForRequests() {
    this.requestPollingSubscription?.unsubscribe();
  }

  respondToRequest(response: 'accept' | 'reject') {
    if (!this.pendingRequest) return;

    const payload = { request_id: this.pendingRequest.id, response };
    this.http.post(`${this.requestApiUrl}respond_to_request.php`, payload).subscribe(async () => {
      if (response === 'accept') {
        this.activeService = this.pendingRequest; // Movemos la solicitud a "activa"
        this.serviceStatus = 'accepted'; // Set status to accepted
        // TODO: Start ETA calculation
        this.eta = '5 min'; // Placeholder
      }
      else {
        this.serviceStatus = 'idle'; // If rejected, go back to idle
      }
      this.pendingRequest = null; // Clear pending request from UI
      const toast = await this.toastCtrl.create({ message: `Servicio ${response === 'accept' ? 'aceptado' : 'rechazado'}.`, duration: 3000, color: 'success' });
      await toast.present();
    });
  }

  acceptBroadcastRequest(requestId: number) {
    const payload = { request_id: requestId };
    // Llamamos al nuevo endpoint que creamos en el Paso 3
    this.http.post<any>(`${this.requestApiUrl}accept_broadcast_request.php`, payload).subscribe({
      next: (res) => {
        // El backend nos devuelve la solicitud completa si la ganamos
        this.activeService = res.service_request;
        this.serviceStatus = 'accepted';
        this.broadcastRequests = []; // Limpiamos la lista
        this.pendingRequest = null;
        this.eta = '5 min'; // Placeholder
        this.showToast('¡Ganaste la solicitud! En camino al servicio.', 'success');
      },
      error: (err) => {
        // Si otro cleaner la aceptó, el backend devolverá un error (ej. 409 Conflict)
        this.showToast(err.error.message || 'Esta solicitud ya no está disponible.', 'warning');
        // Forzamos una recarga de las broadcast para limpiar la que ya no está
        this.broadcastRequests = this.broadcastRequests.filter(req => req.id !== requestId);
        if (this.broadcastRequests.length === 0) {
          this.serviceStatus = 'idle';
        }
      }
    });
  }

  // Este método ya no se llama desde el botón "He Llegado"
  async startService() {
    if (!this.activeService) return;
    
    // Revertimos a solo actualizar el estado localmente
    this.serviceStatus = 'in_progress';
    this.eta = null; // ETA ya no es relevante una vez que comienza el servicio
    const toast = await this.toastCtrl.create({ message: '¡Servicio iniciado!', duration: 3000, color: 'success' });
    await toast.present();
  }

  async arriveAtService() {
    if (!this.activeService) return;

    const loading = await this.loadingCtrl.create({ message: 'Notificando llegada...' });
    await loading.present();

    const arriveApiUrl = `${this.requestApiUrl}arrive_at_service.php`;

    this.http.post(arriveApiUrl, { request_id: this.activeService.id }).subscribe({
      next: async () => {
        loading.dismiss();
        this.serviceStatus = 'pending_verification'; // Cambia la UI para pedir el PIN
        const toast = await this.toastCtrl.create({ message: 'Pide el PIN al cliente para iniciar.', duration: 3000, color: 'primary' });
        await toast.present();
      },
      error: async (err) => {
        loading.dismiss();
        const toast = await this.toastCtrl.create({ message: 'Error al notificar la llegada. Intenta de nuevo.', duration: 3000, color: 'danger' });
        await toast.present();
      }
    });
  }

  async verifyPin() {
    if (!this.activeService || !this.pinValue || this.pinValue.length < 4) return;

    const verifyPinApiUrl = `${this.requestApiUrl}verify_pin.php`;
    const payload = { request_id: this.activeService.id, pin: this.pinValue };

    this.http.post<any>(verifyPinApiUrl, payload).subscribe(async (res) => {
      if (res.success) {
        this.serviceStatus = 'in_progress'; // ¡Éxito! El servicio comienza.
        this.pinValue = ''; // Limpiamos el PIN
        const toast = await this.toastCtrl.create({ message: '¡PIN correcto! Servicio iniciado.', duration: 3000, color: 'success' });
        await toast.present();
      } else {
        const alert = await this.alertCtrl.create({ header: 'PIN Incorrecto', message: 'El PIN no es válido. Por favor, verifica con el cliente.', buttons: ['OK'] });
        await alert.present();
        this.pinValue = ''; // Limpiamos el PIN
      }
    });
  }

  logout() {
    // Detenemos las suscripciones locales de esta página
    this.stopLocationUpdates();
    this.stopPollingForRequests();
    // Llamamos al logout centralizado que se encargará de la API y la sesión.
    this.pendingRequest = null;
    this.activeService = null;
    this.serviceStatus = 'idle';
    this.authService.logout();
  }

  async completeService() {
    if (!this.activeService) return;

    const payload = { request_id: this.activeService.id };
    this.http.post(`${this.requestApiUrl}complete_service.php`, payload).subscribe(async () => {
      const toast = await this.toastCtrl.create({ message: '¡Servicio finalizado!', duration: 3000, color: 'success' });
      await toast.present();
      this.activeService = null; // Limpiamos el servicio activo, volviendo al estado normal
      this.serviceStatus = 'idle'; // Reset service status
      this.loadProfile(); // Recargamos el perfil para mostrar el nuevo saldo
    });
  }

  async goToMessages() {
    if (this.activeService) {
      // Navega directamente a la página de chat con el ID de la solicitud de servicio
      this.router.navigate(['/chat', this.activeService.id]);
    } else {
      const toast = await this.toastCtrl.create({ message: 'No hay un servicio activo para enviar mensajes.', duration: 2000, color: 'warning', position: 'top' });
      await toast.present();
    }
  }

  async requestPayout() {
    if (!this.profile) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Retiro',
      message: `Estás a punto de solicitar un retiro por el total de tu saldo: <strong>${this.profile.wallet_balance.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong>. ¿Deseas continuar?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Sí, Solicitar',
          handler: () => {
            this.proceedWithPayout();
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  private proceedWithPayout() {
    if (!this.profile) return;
    const amount = this.profile.wallet_balance;
    
    const payoutUrl = `${environment.apiUrl}/cleaners/request_payout.php`;
  
    this.http.post(payoutUrl, { amount }, { responseType: 'text' }).subscribe({
      next: async (res: any) => { // Added 'any' type
        const successAlert = await this.alertCtrl.create({ header: 'Solicitud Enviada', message: 'Tu solicitud de retiro ha sido enviada. Un administrador la procesará pronto.', buttons: ['OK'] });
        await successAlert.present();
      },
      error: async (err: any) => { // Added 'any' type
        const errorAlert = await this.alertCtrl.create({ header: 'Error', message: err?.error?.message || 'No se pudo procesar la solicitud. Verifica que tus datos bancarios estén completos o inténtalo más tarde.', buttons: ['OK'] });
        await errorAlert.present();
      }
    });
  }

  async openBankDetailsModal() {
    const modal = await this.modalCtrl.create({
      component: BankDetailsModalPage,
    });
    await modal.present();
  }

  navigateToClient() {
    if (!this.activeService) {
      return;
    }

    const destinationLat = this.activeService.user_latitude;
    const destinationLng = this.activeService.user_longitude;

    // Esta URL está diseñada para abrir Google Maps directamente en modo de navegación
    // hacia las coordenadas del destino. El punto de partida será la ubicación actual del dispositivo.
    // Funciona tanto en Android como en iOS si Google Maps está instalado.
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;

    window.open(url, '_system');
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}