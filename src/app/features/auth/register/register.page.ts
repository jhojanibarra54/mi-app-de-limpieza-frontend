// features/auth/register/register.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonIcon,
  IonSpinner,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  ToastController
} from '@ionic/angular/standalone'; // IonIcon y IonSpinner añadidos
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonHeader, IonIcon, IonSpinner, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonInput, IonButton, CommonModule, ReactiveFormsModule, FormsModule]
})
export class RegisterPage {
  registerForm: FormGroup;
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  // Inyectamos el servicio de autenticación
  private authService = inject(AuthService);

  // Variable para controlar el estado de carga
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    // Añadimos el campo 'phone' al formulario con sus validaciones
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]], // Valida que sean números y una longitud razonable
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Registramos el ícono de Google para poder usarlo en el botón
    addIcons({ logoGoogle });
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      // Si el formulario no es válido, marcamos todos los campos como "tocados" para mostrar los errores.
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: async (res: any) => {
        this.isSubmitting = false;
        // Mostramos un mensaje de éxito más largo e informativo
        const toast = await this.toastCtrl.create({
          message: '¡Registro exitoso! Revisa tu correo electrónico para verificar tu cuenta.',
          duration: 5000, // Más tiempo para que el usuario pueda leerlo
          color: 'success',
          position: 'top'
        });
        await toast.present();
        // Redirigimos al login para que el usuario pueda iniciar sesión después de verificar
        this.router.navigateByUrl('/login');
      },
      error: async (err: any) => { // Añadimos el tipo 'any' al parámetro 'err'
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: err.error.message || 'Error al registrar.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  // Placeholder para la futura implementación del registro con Google
  async registerWithGoogle() {
    const toast = await this.toastCtrl.create({
      message: 'Esta función estará disponible próximamente.',
      duration: 2000,
      color: 'medium'
    });
    await toast.present();
  }
}
