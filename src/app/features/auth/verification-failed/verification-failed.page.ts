import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-verification-failed',
  templateUrl: './verification-failed.page.html',
  styleUrls: ['./verification-failed.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class VerificationFailedPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
