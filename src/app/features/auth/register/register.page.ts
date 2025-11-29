// features/auth/register/register.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  ToastController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonInput, IonButton, CommonModule, ReactiveFormsModule, FormsModule]
})
export class RegisterPage {
  registerForm: FormGroup;
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  // URL de tu API. Asegúrate de que XAMPP esté corriendo.
  private apiUrl = 'http://localhost/php-api/api/auth/register.php';

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      return;
    }

    // Quitamos el foco del botón para evitar el warning de accesibilidad
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    this.http.post(this.apiUrl, this.registerForm.value).subscribe({
      next: async (res: any) => {
        const toast = await this.toastCtrl.create({
          message: res.message,
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.router.navigateByUrl('/login');
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: err.error.message || 'Error al registrar.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}
