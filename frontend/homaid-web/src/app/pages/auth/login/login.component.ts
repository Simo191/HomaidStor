import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiException } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="container my-5">
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h1 class="h3 text-center mb-4">
            <i class="bi bi-box-arrow-in-right text-primary"></i> Connexion
          </h1>

          <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="form-control" [(ngModel)]="email" required email>
            </div>
            <div class="mb-3">
              <label class="form-label">Mot de passe</label>
              <input type="password" name="password" class="form-control" [(ngModel)]="password" required>
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>Connexion...
              } @else {
                Se connecter
              }
            </button>

            <div class="text-center my-3 text-muted">
              <small>ou</small>
            </div>

            <button type="button" class="btn btn-outline-secondary w-100 mb-2" (click)="todoOAuth('Google')">
              <i class="bi bi-google"></i> Continuer avec Google
            </button>
            <button type="button" class="btn btn-outline-secondary w-100" (click)="todoOAuth('Facebook')">
              <i class="bi bi-facebook"></i> Continuer avec Facebook
            </button>

            <hr>
            <p class="text-center mb-0 small">
              Pas encore de compte ?
              <a routerLink="/register" [queryParams]="{ returnUrl: returnUrl }" class="text-primary">Créer un compte</a>
            </p>
            <p class="text-center mt-2 small">
              <a routerLink="/checkout" class="text-muted">
                <i class="bi bi-cart"></i> Continuer en tant qu'invité
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

  submit(f: NgForm): void {
    if (f.invalid) {
      this.toast.error('Email et mot de passe requis.');
      return;
    }
    this.loading.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: r => {
        this.toast.success(`Bienvenue ${r.user.fullName} !`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (e: ApiException) => {
        this.toast.error(e.message || 'Identifiants incorrects.');
        this.loading.set(false);
      }
    });
  }

  todoOAuth(provider: string): void {
    this.toast.info(`Login ${provider} : configure OAuth:${provider}:ClientId dans appsettings et active le SDK côté front.`);
  }
}
