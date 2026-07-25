import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Super-admin sign-in page for the central PathologyManager admin UI. */
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  model = { username: '', password: '' };
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    if (!this.model.username.trim() || !this.model.password) {
      this.error.set('Enter your username and password.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);

    this.auth.login(this.model).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/pathologies';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.status === 401 ? 'Invalid username or password.' : 'Sign-in failed. Please try again.',
        );
      },
    });
  }
}
