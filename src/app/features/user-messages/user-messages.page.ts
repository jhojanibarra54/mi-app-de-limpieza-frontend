import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonBackButton, ToastController, IonNote } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';


interface Conversation {
  id: number; // service_request id
  other_user_name: string; // cleaner's name
  last_message?: string;
  last_message_at?: string;
}

@Component({
  selector: 'app-user-messages',
  templateUrl: './user-messages.page.html',
  styleUrls: ['./user-messages.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonBackButton, IonNote],
})
export class UserMessagesPage implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/php-api/api/common/get_conversations.php';

  public conversations: Conversation[] = [];
  public isLoading = true;
  private toastCtrl = inject(ToastController);

  constructor() { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadConversations();
  }

  loadConversations() {
    this.isLoading = true;
    this.http.get<Conversation[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.conversations = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.presentToast('Error al cargar las conversaciones.', 'danger');
      }
    });
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    await toast.present();
  }
}