import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButton, IonIcon, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, ToastController, IonBackButton } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline, documentTextOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Application {
  id: number;
  user_id: number;
  name: string;
  email: string;
  document_url: string;
  message: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-approvals',
  templateUrl: './admin-approvals.page.html',
  styleUrls: ['./admin-approvals.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButton, IonIcon, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonBackButton]
})
export class AdminApprovalsPage implements OnInit {
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  public authService = inject(AuthService);

  private apiUrl = 'http://localhost/php-api/api/admin/approvals/';
  private baseUrl = 'http://localhost/php-api/';

  public applications: Application[] = [];
  public isLoading = true;

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, documentTextOutline, logOutOutline });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadApplications();
  }

  loadApplications() {
    this.isLoading = true;
    this.http.get<Application[]>(`${this.apiUrl}get_applications.php`).subscribe({
      next: (data) => {
        this.applications = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.presentToast('Error al cargar las solicitudes.', 'danger');
      }
    });
  }

  processApplication(applicationId: number, userId: number, action: 'approve' | 'reject') {
    const payload = { application_id: applicationId, user_id: userId, action };
    this.http.post(`${this.apiUrl}process_application.php`, payload).subscribe({
      next: () => {
        this.presentToast(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'}.`, 'success');
        this.loadApplications(); // Recargamos la lista
      },
      error: () => {
        this.presentToast('Error al procesar la solicitud.', 'danger');
      }
    });
  }

  viewDocument(documentUrl: string) {
    // Abrimos el documento en una nueva pestaña
    window.open(this.baseUrl + documentUrl, '_blank');
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    await toast.present();
  }
}
