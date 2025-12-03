import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  ToastController,
  AlertController,
  IonSpinner,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonBadge,
  IonMenuButton,
  IonListHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Se añaden los nuevos iconos
import { logOutOutline, add, createOutline, trashOutline, arrowBackOutline, listOutline, personAddOutline, cashOutline, cardOutline, trendingUpOutline, trendingDownOutline, walletOutline, peopleOutline, bodyOutline, personCircleOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { AuthService } from '../../core/services/auth.service';

// Definimos una interfaz para la respuesta del API
export interface FinancialSummary {
  total_revenue: number;
  platform_commission: number;
  cleaners_debt_to_platform: number;
  platform_owes_to_cleaners: number;
  debtors: {
    id: number;
    name: string;
    wallet_balance: number;
  }[];
  recent_transactions: {
    id: number;
    grand_total_cost: number;
    payment_method: string;
    cleaner_name: string;
  }[];
}

export interface MasterService {
  id: number;
  name: string;
  description: string;
  base_price: number;
  is_active: boolean;
}

export interface PayoutRequest {
  id: number;
  amount: number;
  cleaner_name: string;
  bank_details_snapshot: {
    bank_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
    account_holder_id: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cleaner' | 'user';
  wallet_balance: number;
  is_approved?: boolean; // Para limpiadores
  created_at: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true, // Agregamos los nuevos componentes de Ionic
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonSpinner, IonNote, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardContent, IonBadge, IonCardTitle, IonCardSubtitle, IonMenuButton, IonListHeader, CurrencyPipe]
})
export class AdminDashboardPage implements OnInit {
  services: MasterService[] = [];
  isLoading = true;
  isLoadingFinancials = true;
  isLoadingPayouts = false;
  isLoadingUsers = false;
  currentView: 'dashboard' | 'services' | 'financials' | 'payouts' | 'users' = 'dashboard';
  pageTitle = 'Panel de Administrador';
  financialSummary: FinancialSummary | null = null;
  financialError: string | null = null;
  payoutRequests: PayoutRequest[] = [];

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  private servicesApiUrl = 'http://localhost/php-api/api/admin/services/';
  private financialApiUrl = 'http://localhost/php-api/api/admin/get_financial_summary.php';
  private payoutApiUrl = 'http://localhost/php-api/api/admin/';
  private usersApiUrl = 'http://localhost/php-api/api/admin/users/';
  users: User[] = [];

  constructor() {
    addIcons({arrowBackOutline,logOutOutline,listOutline,personAddOutline,cashOutline,walletOutline,trendingUpOutline,trendingDownOutline,createOutline,trashOutline,add,cardOutline, peopleOutline, bodyOutline, personCircleOutline});
  }

  ngOnInit() {
    this.loadFinancialData();
  }

  loadServices() {
    this.isLoading = true;
    this.http.get<MasterService[]>(`${this.servicesApiUrl}read.php`).subscribe({
      next: (data) => {
        // El valor de is_active viene como '0' o '1' de la BD, lo convertimos a booleano
        this.services = data.map(service => ({
          ...service,
          is_active: !!+service.is_active
        }));
        this.isLoading = false;
      },
      error: (err) => this.handleApiError(err, 'Error al cargar los servicios.')
    });
  }

  loadFinancialData() {
    this.isLoadingFinancials = true;
    this.financialError = null;
    this.http.get<FinancialSummary>(this.financialApiUrl).subscribe({
      next: (data) => {
        this.financialSummary = data;
        this.isLoadingFinancials = false;
      },
      error: (err) => {
        this.financialError = 'No se pudo cargar la información financiera.';
        console.error(err);
        this.isLoadingFinancials = false;
      }
    });
  }

  setView(view: 'dashboard' | 'services' | 'financials' | 'payouts' | 'users') {
    this.currentView = view;
    this.pageTitle = this.getPageTitle(view);

    if (view === 'payouts') {
      this.loadPayoutRequests();
    }
    if (view === 'financials') {
      this.loadFinancialData();
    }
    if (view === 'services') {
      this.loadServices();
    }
    if (view === 'users') {
      this.loadUsers();
    }
  }

  goToApprovals() {
    // Asegúrate de que la ruta 'admin-approvals' esté definida en tu app.routes.ts
    this.router.navigate(['/admin-approvals']);
  }

  async addService() {
    const alert = await this.alertCtrl.create({
      header: 'Añadir Servicio Maestro',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre del servicio' },
        { name: 'description', type: 'textarea', placeholder: 'Descripción' },
        { name: 'base_price', type: 'number', placeholder: 'Precio Base', min: 0 }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: (data) => this.saveNewService(data) }
      ]
    });
    await alert.present();
  }

  private saveNewService(data: { name: string, description: string, base_price: number }) {
    this.http.post(`${this.servicesApiUrl}create.php`, data).subscribe({
      next: () => this.handleSuccess('Servicio añadido'),
      error: (err) => this.handleApiError(err)
    });
  }

  async editService(service: MasterService) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Servicio',
      inputs: [
        { name: 'name', type: 'text', value: service.name, placeholder: 'Nombre del servicio' },
        { name: 'description', type: 'textarea', value: service.description, placeholder: 'Descripción' },
        { name: 'base_price', type: 'number', value: service.base_price, placeholder: 'Precio Base', min: 0 },
        { name: 'is_active', type: 'checkbox', label: 'Activo', value: '1', checked: service.is_active }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: (data) => {
            const updatedService = { ...data, id: service.id, is_active: Array.isArray(data.is_active) };
            this.saveUpdatedService(updatedService);
          }
        }
      ]
    });
    await alert.present();
  }

  private saveUpdatedService(data: any) {
    this.http.post(`${this.servicesApiUrl}update.php`, data).subscribe({
      next: () => this.handleSuccess('Servicio actualizado'),
      error: (err) => this.handleApiError(err)
    });
  }

  async deleteService(service: MasterService) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar "${service.name}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', handler: () => this.confirmDelete(service.id) }
      ]
    });
    await alert.present();
  }

  private confirmDelete(id: number) {
    this.http.post(`${this.servicesApiUrl}delete.php`, { id }).subscribe({
      next: () => this.handleSuccess('Servicio eliminado'),
      error: (err) => this.handleApiError(err)
    });
  }

  private getPageTitle(view: string): string {
    switch(view) {
      case 'services': return 'Gestionar Servicios';
      case 'financials': return 'Resumen Financiero';
      case 'payouts': return 'Solicitudes de Retiro';
      case 'users': return 'Gestionar Usuarios';
      default: return 'Panel de Administrador';
    }
  }

  private async handleSuccess(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color: 'success' });
    await toast.present();
    this.loadServices();
    this.loadUsers(); // También recargamos usuarios por si acaso
  }

  // ... (resto de los métodos existentes)


  private async handleApiError(error: any, customMessage?: string) {
    this.isLoading = false;
    const message = customMessage || 'Ocurrió un error. Inténtalo de nuevo.';
    const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'danger' });
    await toast.present();
  }

  logout() {
    this.authService.logout();
  }

  loadPayoutRequests() {
    this.isLoadingPayouts = true;
    this.http.get<any[]>(`${this.payoutApiUrl}get_payout_requests.php`).subscribe({
      next: (data) => {
        // El snapshot de los detalles bancarios viene como un string JSON, lo parseamos
        this.payoutRequests = data.map(req => ({
          ...req,
          bank_details_snapshot: JSON.parse(req.bank_details_snapshot)
        }));
        this.isLoadingPayouts = false;
      },
      error: (err) => {
        console.error('Error loading payout requests', err);
        this.isLoadingPayouts = false;
        this.handleApiError(err, 'Error al cargar las solicitudes de retiro.');
      }
    });
  }

  async processPayout(request: PayoutRequest, action: 'complete' | 'reject') {
    const header = action === 'complete' ? 'Confirmar Pago' : 'Rechazar Solicitud';
    const currencyPipe = new CurrencyPipe('es-CO');
    const formattedAmount = currencyPipe.transform(request.amount, 'COP', 'symbol', '1.0-0');

    const message = action === 'complete'
      ? `¿Confirmas que has realizado la transferencia de ${formattedAmount} a ${request.cleaner_name}? Esta acción es irreversible.`
      : `¿Estás seguro de que quieres rechazar esta solicitud?`;

    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Confirmar',
          handler: () => {
            const payload = {
              request_id: request.id,
              action: action
            };
            this.http.post(`${this.payoutApiUrl}process_payout_request.php`, payload).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({
                  message: `Solicitud ${action === 'complete' ? 'completada' : 'rechazada'} con éxito.`,
                  duration: 3000,
                  color: 'success'
                });
                await toast.present();
                this.loadPayoutRequests(); // Recargar la lista
              },
              error: (err) => this.handleApiError(err, 'Error al procesar la solicitud.')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // --- Métodos para Gestión de Usuarios ---

  loadUsers() {
    this.isLoadingUsers = true;
    this.http.get<User[]>(`${this.usersApiUrl}read.php`).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        this.isLoadingUsers = false;
        this.handleApiError(err, 'Error al cargar los usuarios.');
      }
    });
  }

  async createUser() {
    const alert = await this.alertCtrl.create({
      header: 'Crear Nuevo Usuario',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre completo' },
        { name: 'email', type: 'email', placeholder: 'Correo electrónico' },
        { name: 'password', type: 'password', placeholder: 'Contraseña' },
        { name: 'role', type: 'text', placeholder: 'Rol (user, cleaner, admin)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Crear', handler: (data) => this.saveNewUser(data) }
      ]
    });
    await alert.present();
  }

  private saveNewUser(data: any) {
    this.http.post(`${this.usersApiUrl}create.php`, data).subscribe({
      next: () => this.handleSuccess('Usuario creado con éxito.'),
      error: (err) => this.handleApiError(err, 'Error al crear el usuario.')
    });
  }

  async editUser(user: User) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Usuario',
      inputs: [
        { name: 'name', type: 'text', value: user.name },
        { name: 'email', type: 'email', value: user.email },
        { name: 'role', type: 'text', value: user.role, placeholder: 'Rol (user, cleaner, admin)' },
        { name: 'wallet_balance', type: 'number', value: user.wallet_balance, placeholder: 'Saldo de la billetera' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const updatedUser = { ...data, id: user.id };
            this.saveUpdatedUser(updatedUser);
          }
        }
      ]
    });
    await alert.present();
  }

  private saveUpdatedUser(data: any) {
    this.http.post(`${this.usersApiUrl}update.php`, data).subscribe({
      next: () => this.handleSuccess('Usuario actualizado con éxito.'),
      error: (err) => this.handleApiError(err, 'Error al actualizar el usuario.')
    });
  }

  async deleteUser(user: User) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar a <strong>${user.name}</strong>? Esta acción es irreversible.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', handler: () => this.confirmDeleteUser(user.id) }
      ]
    });
    await alert.present();
  }

  private confirmDeleteUser(id: number) {
    this.http.post(`${this.usersApiUrl}delete.php`, { id }).subscribe({
      next: () => this.handleSuccess('Usuario eliminado con éxito.'),
      error: (err) => this.handleApiError(err, 'Error al eliminar el usuario.')
    });
  }
}
