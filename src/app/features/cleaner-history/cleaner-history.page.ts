import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonNote,
  IonBadge
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


export interface HistoryItem {
  id: number;
  grand_total_cost: number;
  status: 'completed' | 'rejected';
  updated_at: string;
  user_name: string;
}

@Component({
  selector: 'app-cleaner-history',
  templateUrl: './cleaner-history.page.html',
  styleUrls: ['./cleaner-history.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonBackButton, IonSpinner, IonBadge]
})
export class CleanerHistoryPage implements OnInit {
  history: HistoryItem[] = [];
  isLoading = true;

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/php-api/api/cleaners/get_history.php';

  constructor() { }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.http.get<HistoryItem[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.history = data;
        this.isLoading = false;
      },
      error: () => {
        this.history = [];
        this.isLoading = false;
      }
    });
  }
}