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
<div class="container my-5 py-md-4">
  <div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
      <div class="auth-card p-4 p-md-5">
        <div class="text-center mb-4">
          <div class="section-sub mb-2" style="color:var(--velisse-rose-gold); letter-spacing:.3em; font-size:.72rem; text-transform:uppercase; font-weight:500">
            Rejoignez-nous
          </div>
          <h1 class="mb-1" style="font-size:1.85rem; font-weight:600">Créer un compte</h1>
          <div class="d-inline-flex align-items-center gap-2 my-2" style="color:var(--velisse-rose-gold)">
            <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
            <i class="bi bi-flower2" style="font-size:.7rem"></i>
            <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
          </div>
          <p class="small mb-0" style="color:var(--velisse-muted)">Votre univers beauté commence ici</p>
        </div>

        <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">Prénom <span class="text-danger">*</span></label>
              <input type="text" name="firstName" class="form-control" [(ngModel)]="form.firstName" required maxlength="80">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">Nom <span class="text-danger">*</span></label>
              <input type="text" name="lastName" class="form-control" [(ngModel)]="form.lastName" required maxlength="80">
            </div>
            <div class="col-12">
              <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">Email <span class="text-danger">*</span></label>
              <input type="email" name="email" class="form-control" [(ngModel)]="form.email" required email>
            </div>
            <div class="col-12">
              <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">Téléphone <span class="text-danger">*</span></label>
              <input type="tel" name="phone" class="form-control" [(ngModel)]="form.phone" required maxlength="30"
                     placeholder="+212 6 00 00 00 00">
            </div>
            <div class="col-12">
              <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">Mot de passe <span class="text-muted">(min. 8 caractères)</span> <span class="text-danger">*</span></label>
              <input type="password" name="password" class="form-control" [(ngModel)]="form.password" required minlength="8" maxlength="100">
            </div>
          </div>

          <button type="submit" class="btn btn-dark w-100 btn-uppercase mt-4" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>Création...
            } @else {
              Créer mon compte
            }
          </button>

          <hr style="border-color:var(--velisse-border); margin:2rem 0 1rem">
          <p class="text-center mb-0 small">
            Déjà inscrit ?
            <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl }"
               style="color:var(--velisse-rose-gold); font-weight:500">Se connecter</a>
          </p>
          <p class="text-center mt-2 mb-0 small">
            <a routerLink="/checkout" style="color:var(--velisse-muted)">
              <i class="bi bi-bag me-1"></i> Continuer en tant qu'invité
            </a>
          </p>
        </form>
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
