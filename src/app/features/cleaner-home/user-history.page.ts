import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonBackButton, IonNote, IonIcon } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

interface HistoryService {
  id: number;
  status: 'completed' | 'cancelled';
  cleaner_name: string | null;
  grand_total_cost: number;
  updated_at: string;
}

@Component({
  selector: 'app-user-history',
  templateUrl: './user-history.page.html',
  styleUrls: ['./user-history.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonButtons, IonBackButton, IonNote, IonIcon]
})
export class UserHistoryPage implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/php-api/api/customers/get_history.php';

  public services: HistoryService[] = [];
  public isLoading = true;

  constructor() {
    addIcons({ checkmarkCircle, closeCircle });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.http.get<HistoryService[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.services = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Opcional: Mostrar un toast de error
      }
    });
  }
}
