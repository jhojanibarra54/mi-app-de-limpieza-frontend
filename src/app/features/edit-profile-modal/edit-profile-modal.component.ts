import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: 'edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonButtons,
    IonIcon
  ],
})
export class EditProfileModalComponent implements OnInit {
  profileForm: FormGroup;
  private modalCtrl = inject(ModalController);
  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  private apiUrl = 'http://localhost/php-api/api/common/update_profile.php';

  constructor() {
    addIcons({ close });
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // La contraseña es opcional
    });
  }

  ngOnInit() {
    // Cargar los datos actuales del usuario en el formulario
    this.http.get<any>('http://localhost/php-api/api/common/get_profile.php').subscribe(user => {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
      });
    });
  }

  dismiss(profileUpdated = false) {
    this.modalCtrl.dismiss({ profileUpdated });
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      return;
    }

    this.http.put(this.apiUrl, this.profileForm.value).subscribe({
      next: async (res: any) => {
        const toast = await this.toastCtrl.create({
          message: 'Perfil actualizado con éxito.',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
        await this.authService.updateToken(res.token); // Usamos un nuevo método para solo actualizar el token
        this.dismiss(true);
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Error al actualizar el perfil.',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}

