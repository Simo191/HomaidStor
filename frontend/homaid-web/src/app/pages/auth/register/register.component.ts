import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiException } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="container my-5">
  <div class="row justify-content-center">
    <div class="col-md-7 col-lg-6">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h1 class="h3 text-center mb-4">
            <i class="bi bi-person-plus text-primary"></i> Créer un compte
          </h1>

          <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Prénom <span class="text-danger">*</span></label>
                <input type="text" name="firstName" class="form-control" [(ngModel)]="form.firstName" required maxlength="80">
              </div>
              <div class="col-md-6">
                <label class="form-label">Nom <span class="text-danger">*</span></label>
                <input type="text" name="lastName" class="form-control" [(ngModel)]="form.lastName" required maxlength="80">
              </div>
              <div class="col-12">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <input type="email" name="email" class="form-control" [(ngModel)]="form.email" required email>
              </div>
              <div class="col-12">
                <label class="form-label">Téléphone <span class="text-danger">*</span></label>
                <input type="tel" name="phone" class="form-control" [(ngModel)]="form.phone" required maxlength="30"
                       placeholder="+212 6 00 00 00 00">
              </div>
              <div class="col-12">
                <label class="form-label">Mot de passe (min. 8 caractères) <span class="text-danger">*</span></label>
                <input type="password" name="password" class="form-control" [(ngModel)]="form.password" required minlength="8" maxlength="100">
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 mt-4" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>Création...
              } @else {
                Créer mon compte
              }
            </button>

            <hr>
            <p class="text-center mb-0 small">
              Déjà inscrit ?
              <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl }" class="text-primary">Se connecter</a>
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
export class RegisterComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

  form = {
    firstName: '', lastName: '', email: '', phone: '', password: '',
    preferredLanguage: 'fr'
  };

  submit(f: NgForm): void {
    if (f.invalid) {
      this.toast.error('Merci de compléter tous les champs.');
      Object.values(f.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.loading.set(true);
    this.auth.register(this.form).subscribe({
      next: r => {
        this.toast.success(`Bienvenue ${r.user.fullName} !`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (e: ApiException) => {
        this.toast.error(e.message || 'Inscription impossible.');
        this.loading.set(false);
      }
    });
  }
}
