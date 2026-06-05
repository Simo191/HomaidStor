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
<div class="page-header">
  <div>
    <h1>Catégories</h1>
    <p class="page-sub">{{ page()?.totalCount ?? 0 }} catégorie(s) au catalogue</p>
  </div>
  <button class="btn btn-primary" (click)="openForm()"><i class="bi bi-plus-lg"></i> Nouvelle catégorie</button>
</div>

<div class="data-card">
  @if (loading()) {
    <div class="text-center p-5"><div class="spinner-border" style="color:#B88577"></div></div>
  } @else if ((page()?.items?.length ?? 0) === 0) {
    <div class="empty-state"><i class="bi bi-diagram-3 display-4"></i><p>Aucune catégorie.</p></div>
  } @else {
    <table class="table mb-0">
      <thead><tr>
        <th>Ordre</th><th>Slug</th><th>Nom (FR)</th><th>Image</th><th>Produits</th><th>Statut</th><th></th>
      </tr></thead>
      <tbody>
        @for (c of page()!.items; track c.id) {
          <tr>
            <td><span class="rank">{{ c.sortOrder }}</span></td>
            <td><code class="slug-code">{{ c.slug }}</code></td>
            <td><strong>{{ getName(c) }}</strong></td>
            <td>
              @if (c.imageUrl) { <img [src]="c.imageUrl" alt="" class="thumb"> }
              @else { <span class="text-muted small">—</span> }
            </td>
            <td><span class="count-badge">{{ c.productCount }}</span></td>
            <td>
              @if (c.isActive) { <span class="status-pill pill-active">Active</span> }
              @else { <span class="status-pill pill-inactive">Inactive</span> }
            </td>
            <td>
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-primary" (click)="openForm(c)" title="Modifier">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="delete(c)" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>

@if (editing()) {
  <div class="modal-backdrop-velisse">
    <div class="modal-velisse">
      <div class="modal-header-v">
        <h5>@if (editingId()) { Modifier la catégorie } @else { Nouvelle catégorie }</h5>
        <button class="btn-close-v" (click)="closeForm()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body-v">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Slug (URL) <span class="text-danger">*</span></label>
            <input class="form-control" [(ngModel)]="form.slug" required placeholder="ex: skin-care">
          </div>
          <div class="col-md-3">
            <label class="form-label">Ordre d'affichage</label>
            <input type="number" class="form-control" [(ngModel)]="form.sortOrder">
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="cat-active" [(ngModel)]="form.isActive">
              <label class="form-check-label" for="cat-active">Active</label>
            </div>
          </div>
          <div class="col-12">
            <label class="form-label">URL de l'image (optionnel)</label>
            <input class="form-control" [(ngModel)]="form.imageUrl" placeholder="https://...">
          </div>

          <div class="col-12"><hr><h6 class="trans-title">Traductions</h6></div>

          <div class="col-md-4">
            <label class="form-label"><span class="flag">🇫🇷</span> Nom (FR) <span class="text-danger">*</span></label>
            <input class="form-control" [(ngModel)]="translations.fr.name" required>
            <textarea class="form-control mt-2" rows="2" placeholder="Description courte"
                      [(ngModel)]="translations.fr.description"></textarea>
          </div>
          <div class="col-md-4">
            <label class="form-label"><span class="flag">🇸🇦</span> Nom (AR)</label>
            <input class="form-control" dir="rtl" [(ngModel)]="translations.ar.name">
            <textarea class="form-control mt-2" rows="2" dir="rtl" placeholder="وصف قصير"
                      [(ngModel)]="translations.ar.description"></textarea>
          </div>
          <div class="col-md-4">
            <label class="form-label"><span class="flag">🇬🇧</span> Name (EN)</label>
            <input class="form-control" [(ngModel)]="translations.en.name">
            <textarea class="form-control mt-2" rows="2" placeholder="Short description"
                      [(ngModel)]="translations.en.description"></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer-v">
        <button class="btn btn-outline-secondary" (click)="closeForm()">Annuler</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
          @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
          Enregistrer
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; align-items:end; margin-bottom:1.5rem; }
    .page-header h1 { font-family:'Playfair Display'; font-size:1.85rem; font-weight:600; margin:0; color:var(--velisse-brown); }
    .page-sub { color:#8B7068; font-size:.9rem; margin:0; }

    .data-card { background:#fff; border:1px solid #EDE4DE; border-radius:12px; overflow:hidden; }
    .data-card .table { margin:0; }
    .data-card .table th { background:#FAF7F4; color:#8B7068; font-weight:500; font-size:.74rem;
                            text-transform:uppercase; letter-spacing:.08em; padding:.65rem 1.25rem;
                            border-bottom:1px solid #EDE4DE; }
    .data-card .table td { padding:.85rem 1.25rem; border-bottom:1px solid #EDE4DE; vertical-align:middle; }
    .data-card .table tr:last-child td { border-bottom:none; }
    .data-card .table tbody tr:hover { background:#FDF7F4; }

    .rank { color:#B88577; font-weight:700; font-family:'Playfair Display'; font-size:1.1rem; }
    .slug-code { color:#8B7068; font-size:.82rem; background:#FAF7F4; padding:.15rem .4rem; border-radius:4px; }
    .thumb { width:36px; height:36px; object-fit:cover; border-radius:6px; }
    .count-badge { background:#FBE9E5; color:#B88577; padding:.25rem .65rem; border-radius:12px; font-weight:600; font-size:.85rem; }
    .status-pill { display:inline-block; padding:.25rem .6rem; border-radius:12px; font-size:.72rem; font-weight:500; }
    .pill-active { background:#E5F0E2; color:#2e5e2a; }
    .pill-inactive { background:#EAEAEA; color:#555; }
    .empty-state { padding:3rem; text-align:center; color:#8B7068; }
    .empty-state i { color:#D5C2BB; }

    /* Modal */
    .modal-backdrop-velisse {
      position:fixed; inset:0; background:rgba(61,40,23,.5);
      z-index:1050; display:flex; align-items:center; justify-content:center;
      padding:1rem; animation:fadeIn .15s;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .modal-velisse {
      background:#fff; border-radius:12px;
      width:100%; max-width:900px; max-height:90vh;
      display:flex; flex-direction:column;
      box-shadow:0 16px 50px rgba(61,40,23,.25);
    }
    .modal-header-v {
      padding:1.25rem 1.5rem; border-bottom:1px solid #EDE4DE;
      display:flex; justify-content:space-between; align-items:center;
    }
    .modal-header-v h5 { font-family:'Playfair Display'; font-weight:600; margin:0; color:var(--velisse-brown); }
    .btn-close-v { background:transparent; border:none; font-size:1.2rem; color:#8B7068; padding:.35rem; border-radius:6px; }
    .btn-close-v:hover { background:#FBE9E5; color:#B88577; }
    .modal-body-v { padding:1.5rem; overflow-y:auto; }
    .modal-footer-v { padding:1rem 1.5rem; border-top:1px solid #EDE4DE; display:flex; gap:.5rem; justify-content:flex-end; }

    .trans-title { font-family:'Poppins'; font-weight:600; color:var(--velisse-brown); text-transform:uppercase; font-size:.8rem; letter-spacing:.12em; }
    .flag { margin-right:.35rem; }
  `]
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
      next: () => { this.toast.success(id ? 'Catégorie mise à jour ✓' : 'Catégorie créée ✓'); this.closeForm(); this.load(); this.saving.set(false); },
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
