import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiException } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
<div class="container my-5 py-md-4">
  <div class="row justify-content-center">
    <div class="col-md-7 col-lg-5">
      <div class="auth-card p-4 p-md-5">
        <div class="text-center mb-4">
          <div class="section-sub mb-2" style="color:var(--velisse-rose-gold); letter-spacing:.3em; font-size:.72rem; text-transform:uppercase; font-weight:500">
            {{ 'auth.welcome' | translate }}
          </div>
          <h1 class="mb-1" style="font-size:1.85rem; font-weight:600">{{ 'auth.login_title' | translate }}</h1>
          <div class="d-inline-flex align-items-center gap-2 my-2" style="color:var(--velisse-rose-gold)">
            <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
            <i class="bi bi-flower2" style="font-size:.7rem"></i>
            <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
          </div>
          <p class="small mb-0" style="color:var(--velisse-muted)">{{ 'auth.login_sub' | translate }}</p>
        </div>

        <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
          <div class="mb-3">
            <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">{{ 'auth.email_label' | translate }}</label>
            <input type="email" name="email" class="form-control" [(ngModel)]="email" required email autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label small text-uppercase" style="letter-spacing:.1em; color:var(--velisse-muted)">{{ 'auth.password_label' | translate }}</label>
            <input type="password" name="password" class="form-control" [(ngModel)]="password" required autocomplete="current-password">
          </div>

          <button type="submit" class="btn btn-dark w-100 btn-uppercase" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>{{ 'auth.submitting_login' | translate }}
            } @else {
              {{ 'auth.submit_login' | translate }}
            }
          </button>

          <div class="divider-fancy">{{ 'auth.or_divider' | translate }}</div>

          <button type="button" class="btn btn-outline-dark w-100 mb-2" (click)="todoOAuth('Google')">
            <i class="bi bi-google me-2"></i> {{ 'auth.google_login' | translate }}
          </button>
          <button type="button" class="btn btn-outline-dark w-100" (click)="todoOAuth('Facebook')">
            <i class="bi bi-facebook me-2"></i> {{ 'auth.facebook_login' | translate }}
          </button>

          <hr style="border-color:var(--velisse-border); margin:2rem 0 1rem">
          <p class="text-center mb-0 small">
            {{ 'auth.no_account' | translate }}
            <a routerLink="/register" [queryParams]="{ returnUrl: returnUrl }"
               style="color:var(--velisse-rose-gold); font-weight:500">{{ 'auth.create_account' | translate }}</a>
          </p>
          <p class="text-center mt-2 mb-0 small">
            <a routerLink="/checkout" style="color:var(--velisse-muted)">
              <i class="bi bi-bag me-1"></i> {{ 'auth.continue_guest' | translate }}
            </a>
          </p>
        </form>
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
  private translate = inject(TranslateService);

  email = '';
  password = '';
  loading = signal(false);
  returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

  submit(f: NgForm): void {
    if (f.invalid) {
      this.toast.error(this.translate.instant('auth.email_password_required'));
      return;
    }
    this.loading.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: r => {
        this.toast.success(this.translate.instant('auth.welcome_back_user', { name: r.user.fullName }));
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (e: ApiException) => {
        this.toast.error(e.message || this.translate.instant('auth.credentials_invalid'));
        this.loading.set(false);
      }
    });
  }

  todoOAuth(provider: string): void {
    this.toast.info(this.translate.instant('auth.oauth_not_configured', { provider }));
  }
}
