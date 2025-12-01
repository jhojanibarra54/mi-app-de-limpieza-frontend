// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError, map, firstValueFrom } from 'rxjs';
import { tap, catchError, filter, take } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { LoginResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// Definimos una clave para guardar el token
const TOKEN_KEY = 'my-auth-token';

import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = new BehaviorSubject<boolean | null>(null);
  private _isAuthReady = new ReplaySubject<boolean>(1);
  public readonly isAuthReady$ = this._isAuthReady.asObservable();
  private currentUserRole = new BehaviorSubject<User['role'] | null>(null);
  private currentUserId = new BehaviorSubject<number | null>(null);
  private currentUserName = new BehaviorSubject<string | null>(null);

  // Nuevo: BehaviorSubject para el estado de conexión del limpiador
  private isCleanerConnected = new BehaviorSubject<boolean>(false);

  // Observables públicos para que los componentes se suscriban
  public isAuthenticated$ = this.isAuthenticated.asObservable();
  public currentUserRole$ = this.currentUserRole.asObservable();
  public currentUserName$ = this.currentUserName.asObservable();
  public isCleanerConnected$ = this.isCleanerConnected.asObservable();

  private http = inject(HttpClient);
  private router = inject(Router);

  private connectionStatusApiUrl = `${environment.apiUrl}/cleaners/toggle-connection.php`;

  // Apuntamos a la carpeta 'auth' del backend para centralizar las rutas.
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor() {
    this.loadToken();
  }

  async loadToken() {
    const tokenData = await Preferences.get({ key: TOKEN_KEY });
    if (tokenData && tokenData.value) {
      const data: LoginResponse = JSON.parse(tokenData.value);
      this.updateAuthState(data);
      this._isAuthReady.next(true);
    } else {
      this.updateAuthState(null);
      this._isAuthReady.next(true);
    }
  }

  private updateAuthState(data: LoginResponse | null) {
    if (data && data.user) {
      this.isAuthenticated.next(true);
      this.currentUserRole.next(data.user.role);
      this.currentUserId.next(data.user.id);
      // Asegurarse de que is_connected se cargue si el usuario es un limpiador
      this.isCleanerConnected.next(data.user.role === 'cleaner' ? (data.user.is_connected ?? false) : false);
      this.currentUserName.next(data.user.name);
    } else {
      this.isAuthenticated.next(false);
      this.currentUserRole.next(null);
      this.currentUserId.next(null);
      this.currentUserName.next(null);
      this.isCleanerConnected.next(false);
    }
  }

  getIsAuthenticated(): Observable<boolean | null> {
    return this.isAuthenticated.asObservable();
  }

  getCurrentUserRole(): Observable<User['role'] | null> {
    return this.currentUserRole.asObservable();
  }

  getCurrentUserId(): Observable<number | null> {
    return this.currentUserId.asObservable();
  }

  getCurrentUserName(): Observable<string | null> {
    return this.currentUserName.asObservable();
  }

  // Método para obtener el token JWT, útil para interceptores
  async getJwtToken(): Promise<string | null> {
    await firstValueFrom(this.isAuthReady$.pipe(filter(isReady => isReady), take(1)));
    const tokenData = await Preferences.get({ key: TOKEN_KEY });
    if (tokenData && tokenData.value) {
      const data: LoginResponse = JSON.parse(tokenData.value);
      return data.token;
    }
    return null;
  }

  /**
   * Actualiza el estado de conexión de un limpiador en el backend y en el estado local.
   * @param isConnected - El nuevo estado de conexión.
   */
  setCleanerConnectionStatus(isConnected: boolean): Observable<any> { // Cambiado a Observable
    this.isCleanerConnected.next(isConnected); // Actualiza el estado local inmediatamente para una UI reactiva
    return this.http.post(`${this.connectionStatusApiUrl}`, { isConnected });
  }

  login(credentials: { email: string, password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login.php`, credentials).pipe(
      tap(async (res) => {
        await Preferences.set({ key: TOKEN_KEY, value: JSON.stringify(res) });
        this.updateAuthState(res);
        this.redirectUser(res.user.role);
      }),
      catchError((err) => {
        this.updateAuthState(null);
        return throwError(() => err);
      })
    );
  }

  /**
   * NUEVO MÉTODO: Registra un nuevo usuario llamando al endpoint correspondiente.
   * @param userDetails - Objeto con name, email, phone y password.
   */
  register(userDetails: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register.php`, userDetails);
  }

  /**
   * Actualiza el token en el almacenamiento y recarga los datos del usuario.
   * @param token - El nuevo JWT.
   */
  async updateToken(token: string) {
    // La API de update_profile devuelve un objeto con `token` y `message` (o similar)
    // El token en sí contiene los datos del usuario.
    const user: User = JSON.parse(atob(token.split('.')[1])).data;
    const loginResponse: LoginResponse = { token, user, message: 'Token updated' };

    await Preferences.set({ key: TOKEN_KEY, value: JSON.stringify(loginResponse) });
    this.updateAuthState(loginResponse);
  }

  private redirectUser(role: User['role']) {
    if (role === 'admin') {
      this.router.navigateByUrl('/admin-dashboard', { replaceUrl: true });
    } else if (role === 'cleaner') {
      this.router.navigateByUrl('/cleaner-home', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/user-home', { replaceUrl: true });
    }
  }

  logout() {
    const role = this.currentUserRole.getValue();

    // Si el usuario es un limpiador, intenta desconectarlo primero.
    const preLogout$ = (role === 'cleaner')
      ? this.http.post(`${environment.apiUrl}/cleaners/toggle-connection.php`, { isConnected: false }).pipe(
          // Transformamos la respuesta (exitosa o con error) a un tipo consistente (null)
          catchError(() => of(null)) // No importa el resultado, siempre continuamos con el logout local
        )
      : of(null); // 'of(null)' crea un observable que emite null y se completa.

    preLogout$.subscribe({
      // No importa si la llamada a la API tiene éxito o falla, procedemos a cerrar la sesión local.
      next: () => this.performLocalLogout(),
      error: () => this.performLocalLogout() // También en caso de error, procedemos
    });
  }

  private async performLocalLogout() {
      await Preferences.remove({ key: TOKEN_KEY });
      this.updateAuthState(null);
      this.router.navigateByUrl('/welcome', { replaceUrl: true });
  }
}
