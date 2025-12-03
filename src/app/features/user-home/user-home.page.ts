import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonAvatar,
  IonButtons,
  IonButton,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonSpinner,
  ModalController,
  IonFab,
  IonFabButton,
  IonMenuButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; 
import { logOutOutline, star, checkmarkCircle, chatbubblesOutline, filterOutline, shuffleOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { FilterModalComponent } from '../filter-modal/filter-modal.component'; // <-- IMPORTAR EL NUEVO MODAL
import { RequestConfirmationModalComponent } from '../request-confirmation-modal/request-confirmation-modal.component';
import { interval, Subscription } from 'rxjs';
import * as L from 'leaflet';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';
import { Geolocation } from '@capacitor/geolocation'; // Import Router
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Preferences } from '@capacitor/preferences';


declare var google: any; // Declaramos google para evitar errores de TypeScript

export interface CleanerService {
  id: number;
  service_name: string;
  description: string;
  price: number;
}
// Definimos una interfaz para tipar los datos de los limpiadores que vienen de la API
interface ActiveRequest {
  id: number;
  status: 'pending' | 'accepted' | 'pending_pin_verification' | 'in_progress' | 'rejected' | 'completed';
  selectedCleaner?: Cleaner; // Guardamos los datos del limpiador seleccionado
  arrival_pin?: string; // El PIN que se mostrará al usuario
  cleaner?: { // Datos del limpiador para el seguimiento
    id: number;
    latitude: number;
    longitude: number;
    transport_mode?: 'driving' | 'walking' | 'bicycling'; // Modo de transporte del limpiador
  };
}

interface Cleaner {
  id: number; // El ID del limpiador
  name: string; // El nombre del limpiador
  latitude: number; // La latitud
  longitude: number; // La longitud
  photo_url: string;
  average_rating: number;
  completed_services: number;
}

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.page.html',
  styleUrls: ['./user-home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule, IonSpinner, IonFooter, IonTabBar, IonTabButton, IonLabel, IonAvatar, CurrencyPipe, DecimalPipe, RouterLink, IonMenuButton, IonFab, IonFabButton]
})
export class UserHomePage implements AfterViewInit, OnDestroy {
  // --- PROPIEDADES DEL MAPA ---
  private map!: L.Map;
  private cleanerMarkers: Map<number, L.Marker> = new Map(); // Almacena los marcadores de los limpiadores para actualizarlos eficientemente.
  private userMarker: L.Marker | null = null; // Marcador para la ubicación del usuario.
  private assignedCleanerMarker: L.Marker | null = null; // Marcador especial para el limpiador asignado a un servicio.

  // --- INYECCIÓN DE DEPENDENCIAS ---
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router); // Se usa para navegar a otras páginas, como la de chat.

  // --- ESTADO DEL COMPONENTE (Públicas para ser usadas en el template `user-home.page.html`) ---
  public selectedCleaner: Cleaner | null = null;
  public selectedCleanerServices: CleanerService[] = [];
  public isLoadingServices = false;
  public userName: string | null = null;
  public activeRequest: ActiveRequest | null = null;
  public cleanerETA: string | null = null; // Propiedad para el ETA (tiempo estimado de llegada)
  public noCleanersAvailable = false; // <-- NUEVA PROPIEDAD

  // --- SUBSCRIPCIONES Y POLLING ---
  private authReadySubscription?: Subscription; // Added to manage subscription to auth service ready state
  private cleanerPollingSubscription?: Subscription;
  private requestStatusPollingSubscription?: Subscription;
  private routePolyline: L.Polyline | null = null; // Polilínea para la ruta del limpiador.
  private userCoords: L.LatLng | null = null; // Coordenadas del usuario.
  private activeFilterServiceId: number | null = null; // Para guardar el filtro activo

  // --- URLs DE LA API (Centralizadas desde `environment.ts`) ---
  private cleanersApiUrl = `${environment.apiUrl}/customers/get-cleaners.php`;
  private routeApiUrl = `${environment.apiUrl}/common/get_route.php`; // Endpoint para obtener la ruta y el ETA.
  private cleanerServicesApiUrl = `${environment.apiUrl}/customers/get-cleaner-services.php`;
  private requestStatusApiUrl = `${environment.apiUrl}/customers/get_request_status.php`;

   constructor() {
    addIcons({ logOutOutline, star, checkmarkCircle, chatbubblesOutline, filterOutline, shuffleOutline });
    this.authService.getCurrentUserName().subscribe(name => {
      this.userName = name;
    });
  }

  ionViewDidEnter() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  // Usamos AfterViewInit para asegurarnos de que el div del mapa ya exista en el DOM
  ngAfterViewInit() {
    this.initMap();
    this.locateUser();

    // Subscribe to auth service ready state
    this.authReadySubscription = this.authService.isAuthReady$.subscribe(async (isReady: boolean) => {
      if (isReady) {
        console.log('AuthService is ready. Proceeding with token-dependent operations.');
        await this.loadActiveRequestFromStorage(); // Cargamos cualquier solicitud activa
        this.loadCleaners(); // Hacemos una carga inicial de los limpiadores para que aparezcan de inmediato.
        this.startCleanerPolling(); // Start polling for cleaners
      } else {
        console.log('AuthService is not yet ready.');
      }
    });
  }

  ngOnDestroy() {
    if (this.cleanerPollingSubscription) {
      this.cleanerPollingSubscription.unsubscribe();
    }
    if (this.requestStatusPollingSubscription) {
      this.requestStatusPollingSubscription.unsubscribe();
    }
    if (this.authReadySubscription) { // Unsubscribe from authReadySubscription
      this.authReadySubscription.unsubscribe();
    }
  }

  private startCleanerPolling() {
    this.cleanerPollingSubscription?.unsubscribe(); // Ensure no duplicate subscriptions
    this.cleanerPollingSubscription = interval(10000).subscribe(() => {
      if (!this.activeRequest || this.activeRequest.status !== 'accepted') {
        this.loadCleaners(this.activeFilterServiceId); // Aplicamos el filtro guardado
      }
    });
  }

  private initMap(): void {
    const ibagueCoords: L.LatLngExpression = [4.438889, -75.232222];
    this.map = L.map('map', {
      center: ibagueCoords,
      zoom: 13
    });

    // Añadimos la capa de teselas (el mapa base) de OpenStreetMap
    // Cambiamos a la capa de CartoDB Positron para un estilo minimalista
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(this.map);

    // Añadimos un evento de clic al mapa para cerrar el panel
    this.map.on('click', () => {
      this.deselectCleaner();
    });

  }

  /**
   * Obtiene la ubicación actual del usuario y la muestra en el mapa.
   */
  private async locateUser() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.userCoords = L.latLng(position.coords.latitude, position.coords.longitude);

      // Centramos el mapa en la ubicación del usuario
      this.map.setView(this.userCoords, 15);

      // Creamos un ícono personalizado para el usuario
      const userIcon = L.icon({
        iconUrl: 'assets/icon/user-marker.png', // Asegúrate de tener esta imagen en src/assets/icon/
        iconSize: [32, 32],
      });
      // Añadimos un marcador para el usuario y lo guardamos
      this.userMarker = L.marker(this.userCoords, { icon: userIcon }).addTo(this.map);

    } catch (e) {
      console.error('Error al obtener la geolocalización', e);
      // Opcional: Mostrar un toast al usuario si no se pudo obtener la ubicación
    }
  }

  /**
   * Carga los limpiadores desde la API y los muestra en el mapa.
   */
  private loadCleaners(serviceId: number | null = null) {
    let url = this.cleanersApiUrl;
    if (serviceId) {
      url += `?service_id=${serviceId}`;
    }

    this.activeFilterServiceId = serviceId; // Guardamos el filtro actual

    this.http.get<Cleaner[]>(url).subscribe({
      next: (response) => {
        this.noCleanersAvailable = response.length === 0; // <-- ACTUALIZAMOS EL ESTADO
        const cleanerIcon = L.icon({
          iconUrl: 'assets/icon/cleaner-marker.png', // Asegúrate de tener esta imagen en src/assets/icon/
          iconSize: [32, 32],
        });

        const receivedCleanerIds = new Set(response.map(c => c.id)); // Correcto: response es un array

        // Actualizar o crear marcadores
        response.forEach(cleaner => {
          const cleanerCoords: L.LatLngExpression = [cleaner.latitude, cleaner.longitude]; // Correcto

          if (this.cleanerMarkers.has(cleaner.id)) {
            // Si el marcador ya existe, solo movemos su posición
            this.cleanerMarkers.get(cleaner.id)!.setLatLng(cleanerCoords); // Correcto
          } else {
            // Si es un nuevo limpiador, creamos el marcador
            const marker = L.marker(cleanerCoords, { icon: cleanerIcon }).addTo(this.map);
            marker.on('click', (e) => {
              L.DomEvent.stopPropagation(e); // Evita que el clic se propague al mapa
              this.selectCleaner(cleaner, marker);
            });
            this.cleanerMarkers.set(cleaner.id, marker);
          }
        });

        // Eliminar marcadores de limpiadores que ya no están conectados
        this.cleanerMarkers.forEach((marker, id) => {
          if (!receivedCleanerIds.has(id)) {
            marker.removeFrom(this.map);
            this.cleanerMarkers.delete(id);
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        // Si no se encuentran limpiadores (error 404), no hacemos nada. Para otros errores, lo mostramos.
        this.noCleanersAvailable = err.status === 404; // <-- ACTUALIZAMOS EL ESTADO
        if (err.status !== 404) {
          console.error('Error al cargar los limpiadores:', err);
        }
      }
    });
  }

  private selectCleaner(cleaner: Cleaner, marker: L.Marker) {
    // Si ya hay uno seleccionado, lo deseleccionamos primero
    this.deselectCleaner();

    this.selectedCleaner = cleaner;
    this.isLoadingServices = true; // Empezamos a cargar

    // Añadimos una clase CSS para resaltar el marcador seleccionado
    L.DomUtil.addClass(marker.getElement()!, 'selected-marker');

    // Hacemos la llamada a la API para obtener los servicios
    this.http.get<CleanerService[]>(`${this.cleanerServicesApiUrl}?cleaner_id=${cleaner.id}`).subscribe({
      next: (services) => {
        this.selectedCleanerServices = services;
        this.isLoadingServices = false; // Terminamos de cargar
      },
      error: (err) => {
        console.error('Error al cargar los servicios del limpiador:', err);
        this.selectedCleanerServices = []; // Limpiamos en caso de error
        this.isLoadingServices = false; // Terminamos de cargar (con error)
      }
    });
  }

  private deselectCleaner() {
    if (this.activeRequest && this.activeRequest.status === 'accepted') {
      // Si hay una solicitud activa y aceptada, no cerramos el panel
      return;
    }

    if (this.selectedCleaner) {
      this.selectedCleanerServices = []; // Limpiamos la lista de servicios
      this.isLoadingServices = false;
      this.selectedCleaner = null;
      // Quitamos la clase de resaltado de todos los marcadores
      this.cleanerMarkers.forEach((m) => {
        if (m.getElement()) {
          L.DomUtil.removeClass(m.getElement()!, 'selected-marker');
        }
      });
    }
  }

  async openFilterModal() {
    const modal = await this.modalCtrl.create({
      component: FilterModalComponent,
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm') {
      // El usuario aplicó o limpió el filtro
      this.loadCleaners(data.serviceId);
    }
  }

  async requestRandomCleaner() {
    // 1. Obtenemos la lista actual de limpiadores (con el filtro aplicado, si existe)
    let url = this.cleanersApiUrl;
    if (this.activeFilterServiceId) {
      url += `?service_id=${this.activeFilterServiceId}`;
    }

    this.http.get<Cleaner[]>(url).subscribe(async (cleaners) => {
      if (cleaners && cleaners.length > 0) {
        // 2. Seleccionamos uno al azar
        const randomIndex = Math.floor(Math.random() * cleaners.length);
        const randomCleaner = cleaners[randomIndex];

        // 3. Abrimos el modal de confirmación con ese limpiador
        this.selectedCleaner = randomCleaner; // Lo asignamos para que el modal funcione
        await this.loadCleanerServicesAndRequest(randomCleaner);
      } else {
        // 4. Si no hay limpiadores, mostramos un mensaje
        this.showStatusUpdateToast('No hay limpiadores disponibles en este momento.', 'warning');
      }
    });
  }

  async broadcastRequest() {
    // Esta función abre el modal de confirmación sin un limpiador específico.
    // El modal necesitará saber que está en modo "broadcast".
    if (!this.userCoords) {
      this.showStatusUpdateToast('No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.', 'danger');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: RequestConfirmationModalComponent,
      componentProps: {
        // No pasamos 'cleaner', pero sí las coordenadas y un flag.
        userCoords: this.userCoords,
        isBroadcast: true // <-- Flag para el modo "enviar a todos"
      }
    });

    await modal.present();
    // La lógica para manejar el resultado del modal se hará en un paso posterior.
  }
  // TODO: Implementar la lógica para el botón "Enviar a todos"
  // Esto requerirá un endpoint en el backend que cree una solicitud "abierta"
  // y un mecanismo para que los cleaners la vean y la acepten (first-come, first-served).
  
  async requestService() {
    if (!this.selectedCleaner) {
      return;
    }
  
    // --- INICIO DE LA SOLUCIÓN ---
    // 1. Obtenemos la ubicación MÁS RECIENTE justo antes de solicitar.
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.userCoords = L.latLng(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      this.showStatusUpdateToast('No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.', 'danger');
      return; // Detenemos si no hay ubicación.
    }
    // --- FIN DE LA SOLUCIÓN ---
  
    const modal = await this.modalCtrl.create({
      component: RequestConfirmationModalComponent,
      componentProps: {
        cleaner: this.selectedCleaner,
        services: this.selectedCleanerServices,
        // Ahora pasamos las coordenadas frescas al modal.
        userCoords: this.userCoords 
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.success && data.requestId) {
      // El modal se cerró con éxito, tenemos un ID de solicitud
      this.activeRequest = {
        id: data.requestId,
        status: 'pending',
        selectedCleaner: this.selectedCleaner! // Guardamos el limpiador para restaurar el panel
      };
      await this.saveActiveRequestToStorage();
      this.startRequestStatusPolling(data.requestId);
    }
  }

  private async saveActiveRequestToStorage() {
    if (this.activeRequest) {
      await Preferences.set({ key: 'active-service-request', value: JSON.stringify(this.activeRequest) });
    } else {
      await Preferences.remove({ key: 'active-service-request' });
    }
  }

  logout() {
    this.authService.logout();
  }

  // Función auxiliar para cargar servicios y luego abrir el modal de solicitud
  private async loadCleanerServicesAndRequest(cleaner: Cleaner) {
    this.isLoadingServices = true;
    this.http.get<CleanerService[]>(`${this.cleanerServicesApiUrl}?cleaner_id=${cleaner.id}`).subscribe({
      next: async (services) => {
        this.selectedCleanerServices = services;
        this.isLoadingServices = false;
        await this.requestService(); // Llamamos a la función que abre el modal
      },
      error: () => {
        this.isLoadingServices = false;
        this.showStatusUpdateToast('No se pudieron cargar los servicios de este limpiador.', 'danger');
      }
    });
  }
  private startRequestStatusPolling(requestId: number) {
    // La respuesta ahora puede incluir los datos del limpiador
    type StatusResponse = { status: ActiveRequest['status'], cleaner?: ActiveRequest['cleaner'], arrival_pin?: string };

    this.requestStatusPollingSubscription = interval(5000).subscribe(() => {
      this.http.get<StatusResponse>(`${this.requestStatusApiUrl}?request_id=${requestId}`).subscribe({
        next: (res) => {
          if (this.activeRequest && this.activeRequest.status !== res.status) {
            this.activeRequest.status = res.status;

            // If the service is accepted, switch to tracking view and get ETA
            if (res.status === 'accepted') {
              this.activeRequest.cleaner = res.cleaner; // Guardamos los datos del limpiador asignado
              this.showStatusUpdateToast(res.status);
              this.switchToTrackingView(res.cleaner); // Cambiamos a la vista de seguimiento.
              this.getRouteAndETA(); // Obtenemos la ruta y el ETA.
            }

            // Si el estado es para verificar PIN, guardamos el PIN y detenemos el seguimiento de ruta.
            if (res.status === 'pending_pin_verification') {
              this.activeRequest.arrival_pin = res.arrival_pin;
              this.showStatusUpdateToast(res.status);
              this.switchToPinVerificationView();
            }

            if (res.status === 'in_progress') {
              this.showStatusUpdateToast(res.status);
              this.switchToDiscoveryView(); // Limpia el mapa para la vista de "en progreso"
            }

            // Si el estado es final (rechazado o completado), mostramos un mensaje y paramos el polling.
            if (res.status === 'rejected' || res.status === 'completed') {
              this.showStatusUpdateToast(res.status);
              this.switchToDiscoveryView(); // Volvemos a la vista normal
              this.stopRequestStatusPolling();
              // Si es rechazado, ocultamos la tarjeta después de un tiempo. Si es completado, la dejamos para que el usuario califique.
              if (res.status === 'rejected') {
                setTimeout(() => {
                  this.activeRequest = null;
                  this.saveActiveRequestToStorage();
                  this.deselectCleaner(); // Cerramos el panel y volvemos al estado inicial
                }, 5000);
              }
            }
            this.saveActiveRequestToStorage(); // Guardamos el estado actualizado
          }
          // If the service is accepted or in_progress, update the cleaner's position and ETA
          // Esto se ejecuta en cada sondeo si el servicio está aceptado
          if (this.activeRequest && this.activeRequest.status === 'accepted' && res.cleaner) {
            this.updateAssignedCleanerPosition(res.cleaner); // Actualiza el marcador del limpiador.
            this.getRouteAndETA(); // Recalcula la ruta y el ETA.
          }
        },
        error: () => this.stopRequestStatusPolling() // Si hay error (ej. 404), paramos.
      });
    });
  }

  private stopRequestStatusPolling() {
    this.requestStatusPollingSubscription?.unsubscribe();
  }

  private async loadActiveRequestFromStorage() {
    const { value } = await Preferences.get({ key: 'active-service-request' });
    if (value) {
      this.activeRequest = JSON.parse(value);

      if (this.activeRequest) {
        // Restauramos el panel del limpiador para que el flujo continúe
        if (this.activeRequest.selectedCleaner) {
          this.selectedCleaner = this.activeRequest.selectedCleaner;
        }

        if (this.activeRequest.status === 'accepted' && this.activeRequest.cleaner) {
          this.switchToTrackingView(this.activeRequest.cleaner);
          this.getRouteAndETA(); // Restauramos la ruta y el ETA.
        }

        if (this.activeRequest.status === 'pending_pin_verification') {
          this.switchToPinVerificationView();
        }

        this.startRequestStatusPolling(this.activeRequest.id);
      }
    }
  }

  private switchToTrackingView(cleanerData?: ActiveRequest['cleaner']) {
    if (!cleanerData) return;

    // 1. Detener el polling de todos los limpiadores
    this.cleanerPollingSubscription?.unsubscribe();

    // 3. Crear un marcador especial para el limpiador asignado
    const assignedCleanerIcon = L.icon({
      iconUrl: 'assets/icon/cleaner-marker.png',
      iconSize: [40, 40], // Más grande
      className: 'assigned-cleaner-marker' // Clase para el brillo dorado
    });

    const coords: L.LatLngExpression = [cleanerData.latitude, cleanerData.longitude];
    this.assignedCleanerMarker = L.marker(coords, { icon: assignedCleanerIcon, zIndexOffset: 1000 }).addTo(this.map);
    this.map.setView(coords, 16); // Centramos el mapa en el limpiador
  }

  private switchToPinVerificationView() {
    // 1. Detener el polling de todos los limpiadores y el seguimiento de ruta
    this.cleanerPollingSubscription?.unsubscribe();
    if (this.routePolyline) {
      this.routePolyline.removeFrom(this.map);
      this.routePolyline = null;
    }
    this.userMarker?.unbindTooltip();

    // 2. Ocultar marcadores para no distraer
    this.cleanerMarkers.forEach(marker => marker.removeFrom(this.map));
    if (this.assignedCleanerMarker) {
      this.assignedCleanerMarker.removeFrom(this.map);
    }

    // El panel ya se actualiza solo gracias al [ngSwitch]
  }

  private updateAssignedCleanerPosition(cleanerData: ActiveRequest['cleaner']) {
    if (this.assignedCleanerMarker && cleanerData) {
      const newCoords: L.LatLngExpression = [cleanerData.latitude, cleanerData.longitude];
      this.assignedCleanerMarker.setLatLng(newCoords);
      this.map.panTo(newCoords); // Movemos suavemente el mapa para seguir al limpiador
    }
  }
  
  /**
   * Obtiene la ruta y el tiempo estimado de llegada desde el backend.
   */
  private async getRouteAndETA() {
    if (!this.userCoords || !this.activeRequest?.cleaner) {
      return;
    }

    const cleaner = this.activeRequest.cleaner;

    try {
      // Llamada real al backend
      const params = {
        user_lat: String(this.userCoords.lat).replace(',', '.'),
        user_lng: String(this.userCoords.lng).replace(',', '.'),
        cleaner_lat: String(cleaner.latitude).replace(',', '.'),
        cleaner_lng: String(cleaner.longitude).replace(',', '.'),
        cleaner_id: cleaner.id.toString() // Añadimos el ID del limpiador
      };

      this.http.get<{ route: [number, number][], eta: string }>(
        this.routeApiUrl,
        { params }
      ).subscribe({
        next: (response) => {
          if (response && response.route) {
            this.cleanerETA = response.eta;
            this.drawRoute(response.route as L.LatLngExpression[]);
            this.updateUserMarkerWithETA(response.eta);
          }
        },
        error: (error) => {
          console.error('Error al obtener la ruta:', error);
          // No hacemos nada en caso de error para que la UI siga mostrando "Calculando..."
        }
      });
    } catch (error) {}
  }

  /**
   * Dibuja la polilínea de la ruta en el mapa.
   */
  private drawRoute(polyline: L.LatLngExpression[]) {
    // Si ya existe una ruta dibujada, la eliminamos.
    if (this.routePolyline) {
      this.routePolyline.removeFrom(this.map);
    }
    // Creamos y añadimos la nueva ruta.
    this.routePolyline = L.polyline(polyline, { color: '#4c47ff', weight: 5 }).addTo(this.map);
  }

  private updateUserMarkerWithETA(eta: string) {
    if (!this.userMarker) return;
    this.userMarker.bindTooltip(`Llega en: <b>${eta}</b>`, { permanent: true, direction: 'top' }).openTooltip();
  }

  private switchToDiscoveryView() {
    // 1. Quitar el marcador del limpiador asignado
    if (this.assignedCleanerMarker) {
      this.assignedCleanerMarker.removeFrom(this.map);
      this.assignedCleanerMarker = null;
    }
    // Quitar la ruta del mapa
    if (this.routePolyline) {
      this.routePolyline.removeFrom(this.map);
      this.routePolyline = null;
    }
    // Quitar el tooltip del marcador de usuario
    this.userMarker?.unbindTooltip();

    // 2. Reiniciar el polling para descubrir a todos los limpiadores
    this.cleanerPollingSubscription?.unsubscribe(); // Asegurarse de que no haya duplicados
    this.cleanerPollingSubscription = interval(10000).subscribe(() => {
      this.loadCleaners();
    });
    this.loadCleaners(); // Carga inicial

    // 3. Opcional: Volver a centrar el mapa en el usuario
    this.locateUser();
  }



  private async showStatusUpdateToast(statusOrMessage: ActiveRequest['status'] | string, toastColor: 'success' | 'danger' | 'primary' | 'secondary' | 'warning' = 'primary') {
    let message: string = '';
    let color: 'success' | 'danger' | 'primary' | 'secondary' | 'warning' = toastColor;

    // Comprobamos si es un estado o un mensaje directo
    if (['accepted', 'rejected', 'completed', 'pending_pin_verification', 'in_progress'].includes(statusOrMessage)) {
      const status = statusOrMessage as ActiveRequest['status'];
      if (status === 'accepted') {
        message = '¡Tu servicio ha sido aceptado!';
        color = 'success';
      } else if (status === 'rejected') {
        message = 'El limpiador ha rechazado el servicio.';
        color = 'danger';
      } else if (status === 'completed') {
        message = '¡El servicio ha finalizado! Por favor, califica el trabajo.';
        color = 'primary';
      } else if (status === 'pending_pin_verification') {
        message = '¡El limpiador ha llegado! Muéstrale tu PIN.';
        color = 'secondary';
      } else if (status === 'in_progress') {
        message = '¡El servicio ha comenzado!';
        color = 'success';
      }
    } else {
      message = statusOrMessage; // Es un mensaje directo
    }

    const toast = await this.toastCtrl.create({ message, duration: 5000, color, position: 'top' });
    await toast.present();
  }

  async openRatingModal() {
    const modal = await this.modalCtrl.create({ component: RatingModalComponent, componentProps: { serviceRequest: this.activeRequest } });
    await modal.present();
    modal.onDidDismiss().then(() => {
      this.activeRequest = null;
      this.saveActiveRequestToStorage();
      this.deselectCleaner(); // Cerramos el panel después de calificar
    });
  }

  async goToMessages() {
    if (this.activeRequest && this.activeRequest.cleaner) {
      // Navega directamente a la página de chat con el ID de la solicitud de servicio
      this.router.navigate(['/chat', this.activeRequest.id]);
    } else {
      const toast = await this.toastCtrl.create({ message: 'No hay un limpiador asignado para enviar mensajes.', duration: 2000, color: 'warning', position: 'top' });
      await toast.present();
    }
  }

}
