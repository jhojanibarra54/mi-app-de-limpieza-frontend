/**
 * Título: Definición de Rutas de la Aplicación (app.routes.ts)
 * Descripción:
 * Este archivo contiene el mapa de navegación de toda la aplicación. Define una colección
 * de objetos `Route`, donde cada objeto asocia una URL (path) con un componente específico.
 * También utiliza "Route Guards" para proteger las rutas y controlar el acceso según el
 * estado de autenticación o el rol del usuario.
 */

import { Routes } from '@angular/router';
// Importa los "guardias" de ruta, que son funciones que deciden si un usuario puede acceder a una ruta.
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';
import { adminGuard } from './core/guards/admin.guard';

// `routes` es un array que contiene todas las definiciones de rutas de la aplicación.
export const routes: Routes = [
  {
    // Ruta raíz de la aplicación (ej: http://localhost:8100/).
    path: '',
    // Redirige automáticamente a la página de 'welcome'.
    redirectTo: 'welcome',
    // La redirección solo se aplica si la ruta está completamente vacía.
    pathMatch: 'full',
  },
  {
    // Ruta para la página de inicio de sesión.
    path: 'login',
    // Carga diferida (Lazy Loading): El componente `LoginPage` solo se descarga y carga cuando el usuario navega a '/login'.
    // Esto mejora el rendimiento inicial de la aplicación.
    loadComponent: () => import('./features/auth/login/login.page').then( m => m.LoginPage),
    // Guardia de ruta: Solo permite el acceso a esta página si el usuario NO está autenticado (gracias a `publicGuard`).
    canActivate: [publicGuard]
  },
  {
    // Ruta para la página de registro.
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.page').then( m => m.RegisterPage),
    canActivate: [publicGuard]
  },
  {
    // Ruta para la página de bienvenida.
    path: 'welcome',
    loadComponent: () => import('./features/welcome/welcome.page').then( m => m.WelcomePage),
    canActivate: [publicGuard]
  },
  {
    // Ruta para la página principal del cliente (usuario normal).
    path: 'user-home',
    loadComponent: () => import('./features/user-home/user-home.page').then(m => m.UserHomePage),
    // Guardia de ruta: Solo permite el acceso si el usuario SÍ está autenticado (gracias a `authGuard`).
    canActivate: [authGuard],
  },
  {
    // Ruta para la página principal del limpiador.
    path: 'cleaner-home',
    loadComponent: () => import('./features/cleaner-home/cleaner-home.page').then(m => m.CleanerHomePage),
    canActivate: [authGuard],
  },
  {
    // Ruta para que un administrador apruebe solicitudes (ej: nuevos limpiadores).
    path: 'admin-approvals',
    loadComponent: () => import('./features/admin-approvals/admin-approvals.page').then( m => m.AdminApprovalsPage),
    canActivate: [authGuard]
  },
  {
    // Ruta para el panel de control del administrador.
    path: 'admin-dashboard',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.page').then( m => m.AdminDashboardPage),
    // Ruta con doble protección: El usuario debe estar autenticado (`authGuard`) Y además tener el rol de administrador (`adminGuard`).
    canActivate: [authGuard, adminGuard]
  },
  {
    // Ruta para el historial de servicios de un limpiador.
    path: 'cleaner-history',
    loadComponent: () => import('./features/cleaner-history/cleaner-history.page').then( m => m.CleanerHistoryPage),
    canActivate: [authGuard]
  },
  {
    // Ruta para la página de chat. ':serviceRequestId' es un parámetro dinámico.
    // Por ejemplo, '/chat/123' abrirá el chat para el servicio con ID 123.
    path: 'chat/:serviceRequestId',
    loadComponent: () => import('./features/chat/chat.page').then( m => m.ChatPage),
    canActivate: [authGuard]
  },
  {
    // Ruta para que un usuario vea sus servicios solicitados.
    path: 'user-services',
    loadComponent: () => import('./features/user-services/user-services.page').then( m => m.UserServicesPage),
    canActivate: [authGuard]
  },
  {
    // Ruta para la página donde un usuario puede solicitar convertirse en limpiador.
    path: 'become-cleaner',
    loadComponent: () => import('./features/become-cleaner/become-cleaner.page').then( m => m.BecomeCleanerPage)
  },
  {
    // Ruta para la lista de mensajes de un limpiador.
    path: 'cleaner-messages',
    loadComponent: () => import('./features/cleaner-messages/cleaner-messages.page').then( m => m.CleanerMessagesPage),
    canActivate: [authGuard]
  },
  {
    // Ruta para la lista de mensajes de un usuario.
    path: 'user-messages',
    loadComponent: () => import('./features/user-messages/user-messages.page').then( m => m.UserMessagesPage),
    canActivate: [authGuard]
  },
  {
    // Ruta para el modal de selección de modo de transporte.
    path: 'transport-mode-modal',
    loadComponent: () => import('./features/transport-mode-modal/transport-mode-modal.page').then( m => m.TransportModeModalPage)
  },
  {
    // Página a la que se redirige si la verificación por correo es exitosa.
    path: 'verification-success',
    loadComponent: () => import('./features/auth/verification-success/verification-success.page').then( m => m.VerificationSuccessPage)
  },
  {
    // Página a la que se redirige si la verificación por correo falla.
    path: 'verification-failed',
    loadComponent: () => import('./features/auth/verification-failed/verification-failed.page').then( m => m.VerificationFailedPage)
  },
];
