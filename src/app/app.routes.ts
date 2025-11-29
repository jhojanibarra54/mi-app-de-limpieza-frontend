import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then( m => m.LoginPage),
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.page').then( m => m.RegisterPage),
    canActivate: [publicGuard]
  },
  {
    path: 'welcome',
    loadComponent: () => import('./features/welcome/welcome.page').then( m => m.WelcomePage),
    canActivate: [publicGuard]
  },
  {
    path: 'user-home',
    loadComponent: () => import('./features/user-home/user-home.page').then(m => m.UserHomePage),
    canActivate: [authGuard],
  },
  {
    path: 'cleaner-home',
    loadComponent: () => import('./features/cleaner-home/cleaner-home.page').then(m => m.CleanerHomePage),
    canActivate: [authGuard],
  },
  {
    path: 'admin-approvals',
    loadComponent: () => import('./features/admin-approvals/admin-approvals.page').then( m => m.AdminApprovalsPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.page').then( m => m.AdminDashboardPage),
    canActivate: [authGuard, adminGuard]
  },

  {
    path: 'cleaner-history',
    loadComponent: () => import('./features/cleaner-history/cleaner-history.page').then( m => m.CleanerHistoryPage),
    canActivate: [authGuard]
  },
  {
    path: 'chat/:serviceRequestId',
    loadComponent: () => import('./features/chat/chat.page').then( m => m.ChatPage),
    canActivate: [authGuard]
  },
  {
    path: 'user-services',
    loadComponent: () => import('./features/user-services/user-services.page').then( m => m.UserServicesPage),
    canActivate: [authGuard]
  },
  {
    path: 'become-cleaner',
    loadComponent: () => import('./features/become-cleaner/become-cleaner.page').then( m => m.BecomeCleanerPage)
  },
  {
    path: 'cleaner-messages',
    loadComponent: () => import('./features/cleaner-messages/cleaner-messages.page').then( m => m.CleanerMessagesPage),
    canActivate: [authGuard]
  },
  {
    path: 'user-messages',
    loadComponent: () => import('./features/user-messages/user-messages.page').then( m => m.UserMessagesPage),
    canActivate: [authGuard]
  },
  {
    path: 'transport-mode-modal',
    loadComponent: () => import('./features/transport-mode-modal/transport-mode-modal.page').then( m => m.TransportModeModalPage)
  },
];
