import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CustomerProfile } from '../../core/models/customer.models';
import { ApiException, ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="card">
  <div class="card-header bg-white"><h5 class="mb-0">Mon profil</h5></div>
  <div class="card-body">
    @if (loading()) {
      <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
    } @else if (profile()) {
      <form #f="ngForm" (ngSubmit)="save(f)" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Prénom <span class="text-danger">*</span></label>
            <input type="text" name="firstName" class="form-control" [(ngModel)]="form.firstName" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Nom <span class="text-danger">*</span></label>
            <input type="text" name="lastName" class="form-control" [(ngModel)]="form.lastName" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" [value]="profile()!.email" disabled>
          </div>
          <div class="col-md-6">
            <label class="form-label">Téléphone <span class="text-danger">*</span></label>
            <input type="tel" name="phone" class="form-control" [(ngModel)]="form.phone" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Langue préférée</label>
            <select class="form-select" name="preferredLanguage" [(ngModel)]="form.preferredLanguage">
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Connexion via</label>
            <input type="text" class="form-control" [value]="profile()!.authProvider" disabled>
          </div>
        </div>
        <button type="submit" class="btn btn-primary mt-3" [disabled]="saving()">
          @if (saving()) {<span class="spinner-border spinner-border-sm me-2"></span>}
          Enregistrer
        </button>
      </form>
    }
  </div>
</div>
  `
})
export class ProfileComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  profile = signal<CustomerProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  form = { firstName: '', lastName: '', phone: '', preferredLanguage: 'fr' };

  constructor() {
    this.api.get<CustomerProfile>('/me').subscribe({
      next: p => {
        this.profile.set(p);
        this.form = {
          firstName: p.firstName, lastName: p.lastName, phone: p.phone,
          preferredLanguage: p.preferredLanguage
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save(f: NgForm): void {
    if (f.invalid) return;
    this.saving.set(true);
    this.api.put<CustomerProfile>('/me', this.form).subscribe({
      next: p => {
        this.profile.set(p);
        this.toast.success('Profil mis à jour.');
        this.saving.set(false);
      },
      error: (e: ApiException) => {
        this.toast.error(e.message);
        this.saving.set(false);
      }
    });
  }
}
