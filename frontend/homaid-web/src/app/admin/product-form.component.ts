import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PagedResult } from '../core/models/api.models';
import { Brand, CategoryListItem, ProductDetail, UpsertProductRequest } from '../core/models/catalog.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

interface ImageForm { url: string; altText: string; sortOrder: number; isPrimary: boolean; }
interface TransForm { name: string; shortDescription: string; description: string; }

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="d-flex justify-content-between mb-3">
  <h1 class="h3 mb-0">
    @if (editingId()) { Modifier le produit } @else { Nouveau produit }
  </h1>
  <a routerLink="/admin/products" class="btn btn-outline-secondary"><i class="bi bi-arrow-left"></i> Retour</a>
</div>

@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
} @else {
<form (ngSubmit)="save()">
<div class="row g-3">
  <div class="col-md-8">
    <!-- General -->
    <div class="card mb-3">
      <div class="card-header"><strong>Informations générales</strong></div>
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label">SKU <span class="text-danger">*</span></label>
            <input class="form-control" [(ngModel)]="form.sku" name="sku" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Slug <span class="text-danger">*</span></label>
            <input class="form-control" [(ngModel)]="form.slug" name="slug" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Catégorie <span class="text-danger">*</span></label>
            <select class="form-select" [(ngModel)]="form.categoryId" name="categoryId" required>
              <option [ngValue]="''">-- Choisir --</option>
              @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Marque</label>
            <select class="form-select" [(ngModel)]="form.brandId" name="brandId">
              <option [ngValue]="null">-- Aucune --</option>
              @for (b of brands(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Prix <span class="text-danger">*</span></label>
            <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="form.basePrice" name="basePrice" required>
          </div>
          <div class="col-md-4">
            <label class="form-label">Prix barré</label>
            <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="form.compareAtPrice" name="compareAtPrice">
          </div>
          <div class="col-md-4">
            <label class="form-label">Devise</label>
            <select class="form-select" [(ngModel)]="form.currency" name="currency">
              <option value="MAD">MAD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Stock</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="form.stockQuantity" name="stockQuantity">
          </div>
          <div class="col-md-4">
            <label class="form-label">Seuil alerte</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="form.lowStockThreshold" name="lowStockThreshold">
          </div>
          <div class="col-md-4">
            <label class="form-label">Poids (kg)</label>
            <input type="number" step="0.001" min="0" class="form-control" [(ngModel)]="form.weightKg" name="weightKg">
          </div>
          <div class="col-12">
            <label class="form-label">Code-barres</label>
            <input class="form-control" [(ngModel)]="form.barcode" name="barcode">
          </div>
        </div>
      </div>
    </div>

    <!-- Translations -->
    <div class="card mb-3">
      <div class="card-header"><strong>Traductions</strong></div>
      <div class="card-body">
        @for (lc of ['fr','ar','en']; track lc) {
          <fieldset class="mb-3">
            <legend class="h6">{{ lc === 'fr' ? '🇫🇷 Français' : lc === 'ar' ? '🇸🇦 العربية' : '🇬🇧 English' }}
              @if (lc === 'fr') { <span class="text-danger">*</span> }
            </legend>
            <div class="row g-2">
              <div class="col-md-6">
                <input class="form-control form-control-sm" placeholder="Nom"
                       [dir]="lc === 'ar' ? 'rtl' : 'ltr'"
                       [(ngModel)]="translations[lc].name" [name]="'tr-name-' + lc">
              </div>
              <div class="col-md-6">
                <input class="form-control form-control-sm" placeholder="Description courte"
                       [dir]="lc === 'ar' ? 'rtl' : 'ltr'"
                       [(ngModel)]="translations[lc].shortDescription" [name]="'tr-sd-' + lc">
              </div>
              <div class="col-12">
                <textarea class="form-control form-control-sm" rows="2" placeholder="Description complète"
                          [dir]="lc === 'ar' ? 'rtl' : 'ltr'"
                          [(ngModel)]="translations[lc].description" [name]="'tr-desc-' + lc"></textarea>
              </div>
            </div>
          </fieldset>
        }
      </div>
    </div>

    <!-- Images -->
    <div class="card mb-3">
      <div class="card-header d-flex justify-content-between">
        <strong>Images</strong>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="addImage()">
          <i class="bi bi-plus"></i> Ajouter
        </button>
      </div>
      <div class="card-body">
        @for (img of images; track $index; let i = $index) {
          <div class="row g-2 align-items-center mb-2">
            <div class="col-md-1">
              @if (img.url) { <img [src]="img.url" style="width:50px;height:50px;object-fit:cover" class="rounded"> }
            </div>
            <div class="col-md-5">
              <input class="form-control form-control-sm" placeholder="URL image" [(ngModel)]="img.url" [name]="'img-url-' + i">
            </div>
            <div class="col-md-3">
              <input class="form-control form-control-sm" placeholder="Alt text" [(ngModel)]="img.altText" [name]="'img-alt-' + i">
            </div>
            <div class="col-md-1">
              <input type="number" min="0" class="form-control form-control-sm" [(ngModel)]="img.sortOrder" [name]="'img-so-' + i">
            </div>
            <div class="col-md-1">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="primary" [(ngModel)]="primaryIndex" [value]="i">
                <label class="form-check-label small">★</label>
              </div>
            </div>
            <div class="col-md-1">
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeImage(i)">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        }
        @if (images.length === 0) { <p class="text-muted small mb-0">Aucune image — ajoute au moins une URL.</p> }
      </div>
    </div>
  </div>

  <!-- Sidebar -->
  <div class="col-md-4">
    <div class="card mb-3">
      <div class="card-header"><strong>Publication</strong></div>
      <div class="card-body">
        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" id="p-active" [(ngModel)]="form.isActive" name="isActive">
          <label class="form-check-label" for="p-active">Actif (visible sur la boutique)</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="p-featured" [(ngModel)]="form.isFeatured" name="isFeatured">
          <label class="form-check-label" for="p-featured">Coup de cœur (mis en avant)</label>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><strong>Attributs (JSON)</strong></div>
      <div class="card-body">
        <textarea class="form-control font-monospace" rows="6" [(ngModel)]="attributesText" name="attrs"
                  placeholder='{ "couleur": "noir", "garantie_mois": 24 }'></textarea>
        <small class="text-muted">JSON libre par catégorie (specs, dates, etc.)</small>
      </div>
    </div>

    <button type="submit" class="btn btn-primary w-100" [disabled]="saving()">
      @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
      @if (editingId()) { Mettre à jour } @else { Créer le produit }
    </button>
  </div>
</div>
</form>
}
  `
})
export class ProductFormComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  editingId = signal<string | null>(null);

  categories = signal<CategoryListItem[]>([]);
  brands = signal<Brand[]>([]);

  form: {
    sku: string; slug: string; categoryId: string; brandId: string | null;
    basePrice: number; compareAtPrice: number | null; currency: string;
    stockQuantity: number; lowStockThreshold: number;
    weightKg: number | null; barcode: string | null;
    isActive: boolean; isFeatured: boolean;
  } = {
    sku: '', slug: '', categoryId: '', brandId: null,
    basePrice: 0, compareAtPrice: null, currency: 'MAD',
    stockQuantity: 0, lowStockThreshold: 5,
    weightKg: null, barcode: null,
    isActive: true, isFeatured: false
  };

  translations: Record<string, TransForm> = {
    fr: { name: '', shortDescription: '', description: '' },
    ar: { name: '', shortDescription: '', description: '' },
    en: { name: '', shortDescription: '', description: '' }
  };

  images: ImageForm[] = [];
  primaryIndex = 0;
  attributesText = '';

  constructor() {
    // Load categories + brands
    this.api.get<{ items: CategoryListItem[] }>('/admin/categories', { page: 1, pageSize: 100 })
      .subscribe(r => this.categories.set(r.items.map(c => ({ ...c, name: c.name }))));
    this.api.get<PagedResult<Brand>>('/admin/brands', { page: 1, pageSize: 100 })
      .subscribe(r => this.brands.set(r.items));

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editingId.set(id);
      this.api.get<ProductDetail>(`/admin/products/${id}`).subscribe({
        next: p => this.populate(p),
        error: () => { this.toast.error('Produit introuvable'); this.router.navigate(['/admin/products']); }
      });
    } else {
      this.loading.set(false);
    }
  }

  private populate(p: ProductDetail) {
    this.form = {
      sku: p.sku, slug: p.slug, categoryId: p.categoryId, brandId: p.brandId ?? null,
      basePrice: p.basePrice, compareAtPrice: p.compareAtPrice ?? null, currency: p.currency,
      stockQuantity: p.stockQuantity, lowStockThreshold: p.lowStockThreshold,
      weightKg: p.weightKg ?? null, barcode: p.barcode ?? null,
      isActive: p.isActive, isFeatured: p.isFeatured
    };
    ['fr', 'ar', 'en'].forEach(lc => {
      const t = p.translations.find(x => x.languageCode === lc);
      this.translations[lc] = {
        name: t?.name ?? '', shortDescription: t?.shortDescription ?? '', description: t?.description ?? ''
      };
    });
    this.images = p.images.map(i => ({
      url: i.url, altText: i.altText ?? '', sortOrder: i.sortOrder, isPrimary: i.isPrimary
    }));
    this.primaryIndex = Math.max(0, this.images.findIndex(i => i.isPrimary));
    this.attributesText = p.attributes ? JSON.stringify(p.attributes, null, 2) : '';
    this.loading.set(false);
  }

  addImage() {
    this.images.push({ url: '', altText: '', sortOrder: this.images.length, isPrimary: this.images.length === 0 });
  }
  removeImage(i: number) {
    this.images.splice(i, 1);
    if (this.primaryIndex >= this.images.length) this.primaryIndex = 0;
  }

  save() {
    let attributes: Record<string, unknown> | null = null;
    if (this.attributesText.trim()) {
      try { attributes = JSON.parse(this.attributesText); }
      catch { this.toast.error('JSON des attributs invalide'); return; }
    }

    const req: UpsertProductRequest = {
      sku: this.form.sku, slug: this.form.slug,
      categoryId: this.form.categoryId, brandId: this.form.brandId || null,
      basePrice: Number(this.form.basePrice), compareAtPrice: this.form.compareAtPrice ?? null,
      currency: this.form.currency,
      stockQuantity: Number(this.form.stockQuantity), lowStockThreshold: Number(this.form.lowStockThreshold),
      weightKg: this.form.weightKg ?? null, barcode: this.form.barcode || null,
      attributes,
      isActive: this.form.isActive, isFeatured: this.form.isFeatured,
      publishedAt: null,
      translations: Object.entries(this.translations)
        .filter(([, t]) => t.name)
        .map(([lc, t]) => ({ languageCode: lc, name: t.name, shortDescription: t.shortDescription || undefined, description: t.description || undefined })),
      images: this.images
        .filter(i => i.url)
        .map((i, idx) => ({ url: i.url, altText: i.altText || undefined, sortOrder: i.sortOrder, isPrimary: idx === this.primaryIndex }))
    };

    if (!req.translations.length) { this.toast.error('Au moins une traduction est requise (FR)'); return; }
    if (!req.categoryId) { this.toast.error('Catégorie requise'); return; }

    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.api.put<ProductDetail>(`/admin/products/${id}`, req)
      : this.api.post<ProductDetail>('/admin/products', req);
    obs.subscribe({
      next: () => { this.toast.success(id ? 'Mis à jour' : 'Créé'); this.router.navigate(['/admin/products']); },
      error: (e: ApiException) => { this.toast.error(e.message); this.saving.set(false); }
    });
  }
}
