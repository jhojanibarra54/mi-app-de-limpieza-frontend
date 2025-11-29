import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface Conversation {
  id: number;
  other_user_name: string;
}

@Component({
  selector: 'app-cleaner-messages',
  templateUrl: './cleaner-messages.page.html',
  styleUrls: ['./cleaner-messages.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonBackButton]
})
export class CleanerMessagesPage implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/php-api/api/common/get_conversations.php';

  public conversations: Conversation[] = [];
  public isLoading = true;

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
      }
    });
  }
}
