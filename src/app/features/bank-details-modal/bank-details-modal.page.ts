import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonList, IonItem, IonLabel, IonInput, ModalController, ToastController, IonSpinner } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-bank-details-modal',
  templateUrl: './bank-details-modal.page.html',
  styleUrls: ['./bank-details-modal.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonList, IonItem, IonLabel, IonInput, IonSpinner]
})
export class BankDetailsModalPage implements OnInit {
  bankDetailsForm: FormGroup;
  isLoading = true;
  isSaving = false;

  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);

  private apiUrl = `${environment.apiUrl}/cleaners/`;

  constructor() {
    this.bankDetailsForm = this.fb.group({
      bank_name: ['', Validators.required],
      account_type: ['', Validators.required],
      account_number: ['', Validators.required],
      account_holder_name: ['', Validators.required],
      account_holder_id: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadBankDetails();
  }

  loadBankDetails() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}get_bank_details.php`).subscribe({
      next: (data) => {
        if (data) {
          this.bankDetailsForm.patchValue(data);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.presentToast('Error al cargar tus datos.', 'danger');
      }
    });
  }

  async saveDetails() {
    if (this.bankDetailsForm.invalid) {
      this.presentToast('Por favor, completa todos los campos.', 'warning');
      return;
    }

    this.isSaving = true;
    this.http.post(`${this.apiUrl}save_bank_details.php`, this.bankDetailsForm.value).subscribe({
      next: async () => {
        this.isSaving = false;
        await this.presentToast('¡Datos guardados con éxito!', 'success');
        this.modalCtrl.dismiss();
      },
      error: (err) => {
        this.isSaving = false;
        this.presentToast(err.error?.message || 'No se pudieron guardar los datos.', 'danger');
      }
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    await toast.present();
  }
}