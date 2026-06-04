import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PagedResult } from '../core/models/api.models';
import { CategoryDetail, UpsertCategoryRequest } from '../core/models/catalog.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="d-flex justify-content-between mb-3">
  <h1 class="h3 mb-0">Catégories</h1>
  <button class="btn btn-primary" (click)="openForm()"><i class="bi bi-plus"></i> Nouvelle catégorie</button>
</div>

<div class="card">
  <div class="card-body p-0">
    @if (loading()) { <div class="text-center p-4"><div class="spinner-border text-primary"></div></div> }
    @else if ((page()?.items?.length ?? 0) === 0) { <div class="text-center p-4 text-muted">Aucune catégorie.</div> }
    @else {
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>Slug</th><th>Nom (FR)</th><th>Produits</th><th>Actif</th><th>Ordre</th><th></th>
        </tr></thead>
        <tbody>
          @for (c of page()!.items; track c.id) {
            <tr>
              <td><code>{{ c.slug }}</code></td>
              <td>{{ getName(c) }}</td>
              <td>{{ c.productCount }}</td>
              <td>@if (c.isActive) { <i class="bi bi-check-circle-fill text-success"></i> }
                  @else { <i class="bi bi-x-circle text-muted"></i> }</td>
              <td>{{ c.sortOrder }}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" (click)="openForm(c)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="delete(c)">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>
</div>

<!-- Form modal -->
@if (editing()) {
  <div class="modal d-block" style="background: rgba(0,0,0,.5)">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">@if (editingId()) { Modifier } @else { Créer } une catégorie</h5>
          <button class="btn-close" (click)="closeForm()"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Slug <span class="text-danger">*</span></label>
              <input class="form-control" [(ngModel)]="form.slug" required>
            </div>
            <div class="col-md-3">
              <label class="form-label">Ordre</label>
              <input type="number" class="form-control" [(ngModel)]="form.sortOrder">
            </div>
            <div class="col-md-3 d-flex align-items-center pt-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cat-active" [(ngModel)]="form.isActive">
                <label class="form-check-label" for="cat-active">Actif</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Image URL</label>
              <input class="form-control" [(ngModel)]="form.imageUrl">
            </div>

            <hr>
            <h6>Traductions</h6>
            <div class="col-md-4">
              <label class="form-label">Nom 🇫🇷 FR <span class="text-danger">*</span></label>
              <input class="form-control" [(ngModel)]="translations.fr.name" required>
              <label class="form-label small mt-2">Description FR</label>
              <textarea class="form-control" rows="2" [(ngModel)]="translations.fr.description"></textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label">Nom 🇸🇦 AR</label>
              <input class="form-control" [(ngModel)]="translations.ar.name" dir="rtl">
              <label class="form-label small mt-2">Description AR</label>
              <textarea class="form-control" rows="2" dir="rtl" [(ngModel)]="translations.ar.description"></textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label">Nom 🇬🇧 EN</label>
              <input class="form-control" [(ngModel)]="translations.en.name">
              <label class="form-label small mt-2">Description EN</label>
              <textarea class="form-control" rows="2" [(ngModel)]="translations.en.description"></textarea>
            </div>
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
export class CategoriesAdminComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  page = signal<PagedResult<CategoryDetail> | null>(null);
  loading = signal(true);
  editing = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  form: { slug: string; sortOrder: number; imageUrl: string | null; isActive: boolean } = {
    slug: '', sortOrder: 0, imageUrl: null, isActive: true
  };
  translations = {
    fr: { name: '', description: '' },
    ar: { name: '', description: '' },
    en: { name: '', description: '' }
  };

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PagedResult<CategoryDetail>>('/admin/categories', { page: 1, pageSize: 100 }).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getName(c: CategoryDetail): string {
    return c.translations.find(t => t.languageCode === 'fr')?.name ?? c.translations[0]?.name ?? c.slug;
  }

  openForm(c?: CategoryDetail) {
    if (c) {
      this.editingId.set(c.id);
      this.form = { slug: c.slug, sortOrder: c.sortOrder, imageUrl: c.imageUrl ?? null, isActive: c.isActive };
      this.translations = {
        fr: { name: c.translations.find(t => t.languageCode === 'fr')?.name ?? '', description: c.translations.find(t => t.languageCode === 'fr')?.description ?? '' },
        ar: { name: c.translations.find(t => t.languageCode === 'ar')?.name ?? '', description: c.translations.find(t => t.languageCode === 'ar')?.description ?? '' },
        en: { name: c.translations.find(t => t.languageCode === 'en')?.name ?? '', description: c.translations.find(t => t.languageCode === 'en')?.description ?? '' }
      };
    } else {
      this.editingId.set(null);
      this.form = { slug: '', sortOrder: 0, imageUrl: null, isActive: true };
      this.translations = { fr: { name: '', description: '' }, ar: { name: '', description: '' }, en: { name: '', description: '' } };
    }
    this.editing.set(true);
  }

  closeForm() { this.editing.set(false); }

  save() {
    const req: UpsertCategoryRequest = {
      slug: this.form.slug,
      sortOrder: this.form.sortOrder,
      imageUrl: this.form.imageUrl || null,
      isActive: this.form.isActive,
      translations: Object.entries(this.translations)
        .filter(([, v]) => v.name)
        .map(([lc, v]) => ({ languageCode: lc, name: v.name, description: v.description }))
    };
    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.api.put<CategoryDetail>(`/admin/categories/${id}`, req)
      : this.api.post<CategoryDetail>('/admin/categories', req);
    obs.subscribe({
      next: () => { this.toast.success(id ? 'Catégorie mise à jour' : 'Catégorie créée'); this.closeForm(); this.load(); this.saving.set(false); },
      error: (e: ApiException) => { this.toast.error(e.message); this.saving.set(false); }
    });
  }

  delete(c: CategoryDetail) {
    if (!confirm(`Supprimer la catégorie "${this.getName(c)}" ?`)) return;
    this.api.delete(`/admin/categories/${c.id}`).subscribe({
      next: () => { this.toast.success('Supprimée'); this.load(); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }
}
