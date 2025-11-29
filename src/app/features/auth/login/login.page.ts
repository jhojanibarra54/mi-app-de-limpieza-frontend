import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { LoginResponse } from '../../../core/models/auth.model';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonInput, IonButton, CommonModule, ReactiveFormsModule, FormsModule],
})
export class LoginPage {
  loginForm: FormGroup;

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    // Quitamos el foco del botón para evitar el warning de accesibilidad
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    this.authService.login(this.loginForm.value).subscribe(
      {
        next: (res: LoginResponse) => {
          // Esperamos a que el estado de autenticación se confirme como 'true'
          this.authService.getIsAuthenticated().pipe(
            filter(isAuthenticated => isAuthenticated === true), // Solo continuamos si es true
            take(1) // Nos desuscribimos después de la primera confirmación
          ).subscribe(() => {
            loading.dismiss();
            // Redirección basada en el rol del usuario
            const role = res.user.role;
            if (role === 'cleaner') {
              this.router.navigateByUrl('/cleaner-home', { replaceUrl: true });
            } else if (role === 'admin') {
              this.router.navigateByUrl('/admin-approvals', { replaceUrl: true });
            } else {
              this.router.navigateByUrl('/user-home', { replaceUrl: true });
            }
          });
        },
        error: async (err: any) => {
          loading.dismiss();
          const toast = await this.toastCtrl.create({
            message: err.error.message || 'Error al iniciar sesión.',
            duration: 3000,
            color: 'danger'
          });
          await toast.present();
        },
      }
    );
  }
}
