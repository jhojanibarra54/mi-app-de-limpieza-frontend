import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  sparkles, 
  logIn, 
  personAdd, 
  shieldCheckmark, 
  time,
  star
} from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonButton, 
    IonIcon, 
    CommonModule, 
    FormsModule, 
    RouterLink
  ]
})
export class WelcomePage implements OnInit {
  
  // Variables para animaciones o estado
  isAnimating = true;

  constructor() {
    // ✅ CORREGIDO: Solo una lista de íconos sin duplicados
    addIcons({
      sparkles,
      'log-in': logIn,
      'person-add': personAdd,
      'shield-checkmark': shieldCheckmark,
      time,
      star
    });
  }

  ngOnInit() {
    this.initializePremiumPage();
  }

  private initializePremiumPage(): void {
    // Cargar fuentes premium
    this.loadPremiumFonts();
    
    // Inicializar efectos especiales
    this.setupPremiumEffects();
  }

  private loadPremiumFonts(): void {
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }

  private setupPremiumEffects(): void {
    // Podemos añadir efectos adicionales aquí
    console.log('Efectos premium inicializados');
    
    // Ejemplo: Podríamos añadir un efecto de entrada más elaborado
    setTimeout(() => {
      this.isAnimating = false;
    }, 1000);
  }

  // Método para manejar interacciones premium
  onButtonHover(): void {
    // Podemos añadir efectos de sonido o microinteracciones aquí
  }
}