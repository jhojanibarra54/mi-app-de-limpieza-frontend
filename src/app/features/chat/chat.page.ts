import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonIcon, IonFooter, IonSpinner, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, switchMap, startWith } from 'rxjs';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

interface Message {
  id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonIcon, IonFooter, IonSpinner, IonBackButton, IonButtons]
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private messagesApiUrl = 'http://localhost/php-api/api/chat/get_messages.php';
  private sendApiUrl = 'http://localhost/php-api/api/chat/send_message.php';

  public messages: Message[] = [];
  public newMessage = '';
  public serviceRequestId!: number;
  public currentUserId: number | null = null; // Para saber si el mensaje es nuestro o del otro
  public isLoading = true;

  private pollingSubscription?: Subscription;

  constructor() {
    addIcons({ send });
  }

  ngOnInit() {
    this.serviceRequestId = +this.route.snapshot.paramMap.get('serviceRequestId')!;
    // Obtenemos el ID del usuario actual desde el token (necesitarás implementar esto en AuthService)
    this.authService.getCurrentUserId().subscribe(id => {
      this.currentUserId = id;
    });
    this.startPolling();
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  startPolling() {
    this.pollingSubscription = interval(3000) // Polling cada 3 segundos
      .pipe(
        startWith(0), // Para que se ejecute inmediatamente la primera vez
        switchMap(() => this.http.get<Message[]>(`${this.messagesApiUrl}?service_request_id=${this.serviceRequestId}`))
      )
      .subscribe(newMessages => {
        this.isLoading = false;
        // Solo actualizamos y hacemos scroll si hay mensajes nuevos
        if (this.messages.length < newMessages.length) {
          this.messages = newMessages;
          setTimeout(() => this.scrollToBottom(), 100);
        } else if (this.messages.length === 0 && newMessages.length > 0) {
          this.messages = newMessages;
        }
      });
  }

  sendMessage() {
    if (this.newMessage.trim() === '') return;

    const payload = {
      service_request_id: this.serviceRequestId,
      message: this.newMessage
    };

    this.http.post(this.sendApiUrl, payload).subscribe(() => {
      // Opcional: Añadir el mensaje localmente para una UI más rápida
      // En este caso, el polling lo recogerá en el siguiente ciclo
    });

    this.newMessage = ''; // Limpiamos el input
  }

  scrollToBottom() {
    this.content.scrollToBottom(300);
  }
}
