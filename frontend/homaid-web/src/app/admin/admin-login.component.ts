import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiException } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="d-flex align-items-center justify-content-center" style="min-height:100vh; background:#f0f2f5">
  <div class="card shadow" style="width: 100%; max-width: 420px">
    <div class="card-body p-4">
      <div class="text-center mb-4">
        <i class="bi bi-shield-lock-fill text-primary display-4"></i>
        <h2 class="h4 mt-2">Espace Administrateur</h2>
        <p class="text-muted small">Homaid Store</p>
      </div>
      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" name="email" class="form-control" [(ngModel)]="email" required email autofocus>
        </div>
        <div class="mb-3">
          <label class="form-label">Mot de passe</label>
          <input type="password" name="password" class="form-control" [(ngModel)]="password" required>
        </div>
        <button type="submit" class="btn btn-primary w-100" [disabled]="loading()">
          @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span>Connexion... }
          @else { Se connecter }
        </button>
      </form>
    </div>
  </div>
</div>
  `
})
export class AdminLoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/admin';

  submit(f: NgForm): void {
    if (f.invalid) return;
    this.loading.set(true);
    this.auth.loginAdmin({ email: this.email, password: this.password }).subscribe({
      next: r => {
        this.toast.success(`Bienvenue ${r.user.fullName}`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (e: ApiException) => {
        this.toast.error(e.message || 'Identifiants incorrects.');
        this.loading.set(false);
      }
    });
  }
}
