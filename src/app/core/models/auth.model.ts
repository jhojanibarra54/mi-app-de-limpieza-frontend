// src/app/core/models/auth.model.ts

export interface User {
  id: number; // <-- Añadir esta línea
  name: string;
  email: string;
  role: 'user' | 'cleaner' | 'admin';
  is_connected?: boolean; // Añadimos la propiedad. Es opcional (?) porque los 'user' no la tendrán.
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}
