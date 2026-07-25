import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresAtUtc: string;
}

const TOKEN_KEY = 'pm_admin_token';
const USER_KEY = 'pm_admin_user';

/**
 * Super-admin authentication for the central PathologyManager UI. Stores the JWT in
 * localStorage and exposes reactive auth state. The token is attached to API calls by
 * the functional auth interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private readonly _token = signal<string | null>(this.readToken());
  private readonly _username = signal<string | null>(localStorage.getItem(USER_KEY));

  readonly username = this._username.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/api/auth/login`, request).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, res.username);
        this._token.set(res.token);
        this._username.set(res.username);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._username.set(null);
  }

  token(): string | null {
    return this._token();
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
