import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-verification-success',
  templateUrl: './verification-success.page.html',
  styleUrls: ['./verification-success.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class VerificationSuccessPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
