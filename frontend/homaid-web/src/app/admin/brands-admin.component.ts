import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PagedResult } from '../core/models/api.models';
import { Brand, UpsertBrandRequest } from '../core/models/catalog.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-brands-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="d-flex justify-content-between mb-3">
  <h1 class="h3 mb-0">Marques</h1>
  <button class="btn btn-primary" (click)="openForm()"><i class="bi bi-plus"></i> Nouvelle marque</button>
</div>

<div class="card">
  <div class="card-body p-0">
    @if (loading()) { <div class="text-center p-4"><div class="spinner-border text-primary"></div></div> }
    @else if ((page()?.items?.length ?? 0) === 0) { <div class="text-center p-4 text-muted">Aucune marque.</div> }
    @else {
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>Logo</th><th>Nom</th><th>Slug</th><th>Produits</th><th>Actif</th><th></th>
        </tr></thead>
        <tbody>
          @for (b of page()!.items; track b.id) {
            <tr>
              <td>@if (b.logoUrl) { <img [src]="b.logoUrl" [alt]="b.name" style="height:30px"> }</td>
              <td><strong>{{ b.name }}</strong></td>
              <td><code>{{ b.slug }}</code></td>
              <td>{{ b.productCount }}</td>
              <td>@if (b.isActive) { <i class="bi bi-check-circle-fill text-success"></i> }
                  @else { <i class="bi bi-x-circle text-muted"></i> }</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" (click)="openForm(b)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" (click)="delete(b)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>
</div>

@if (editing()) {
  <div class="modal d-block" style="background: rgba(0,0,0,.5)">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">@if (editingId()) { Modifier } @else { Créer } une marque</h5>
          <button class="btn-close" (click)="closeForm()"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Nom <span class="text-danger">*</span></label>
            <input class="form-control" [(ngModel)]="form.name" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Slug <span class="text-danger">*</span></label>
            <input class="form-control" [(ngModel)]="form.slug" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Logo URL</label>
            <input class="form-control" [(ngModel)]="form.logoUrl">
          </div>
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" rows="3" [(ngModel)]="form.description"></textarea>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="brand-active" [(ngModel)]="form.isActive">
            <label class="form-check-label" for="brand-active">Actif</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-secondary" (click)="closeForm()">Annuler</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  </div>
}
  `
})
export class BrandsAdminComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  page = signal<PagedResult<Brand> | null>(null);
  loading = signal(true);
  editing = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  form: UpsertBrandRequest = { name: '', slug: '', logoUrl: null, description: null, isActive: true };

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PagedResult<Brand>>('/admin/brands', { page: 1, pageSize: 100 }).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openForm(b?: Brand) {
    if (b) {
      this.editingId.set(b.id);
      this.form = { name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? null, description: b.description ?? null, isActive: b.isActive };
    } else {
      this.editingId.set(null);
      this.form = { name: '', slug: '', logoUrl: null, description: null, isActive: true };
    }
    this.editing.set(true);
  }
  closeForm() { this.editing.set(false); }

  save() {
    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.api.put<Brand>(`/admin/brands/${id}`, this.form)
      : this.api.post<Brand>('/admin/brands', this.form);
    obs.subscribe({
      next: () => { this.toast.success(id ? 'Mise à jour' : 'Créée'); this.closeForm(); this.load(); this.saving.set(false); },
      error: (e: ApiException) => { this.toast.error(e.message); this.saving.set(false); }
    });
  }

  delete(b: Brand) {
    if (!confirm(`Supprimer "${b.name}" ?`)) return;
    this.api.delete(`/admin/brands/${b.id}`).subscribe({
      next: () => { this.toast.success('Supprimée'); this.load(); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }
}
