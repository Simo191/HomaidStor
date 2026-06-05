import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillEditorComponent } from 'ngx-quill';
import { PagedResult } from '../core/models/api.models';
import { Brand, CategoryListItem, ProductDetail, UpsertProductRequest } from '../core/models/catalog.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

interface ImageForm { url: string; altText: string; sortOrder: number; isPrimary: boolean; }
interface TransForm { name: string; shortDescription: string; description: string; }

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule, QuillEditorComponent],
  template: `
<div class="page-header">
  <div>
    <h1>@if (editingId()) { Modifier le produit } @else { Nouveau produit }</h1>
    <p class="page-sub">@if (editingId()) { Mise à jour des informations existantes } @else { Créer un nouveau produit dans le catalogue }</p>
  </div>
  <a routerLink="/admin/products" class="btn btn-outline-secondary btn-sm">
    <i class="bi bi-arrow-left"></i> Retour à la liste
  </a>
</div>

@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border" style="color:#B88577"></div></div>
} @else {
<form (ngSubmit)="save()">
<div class="row g-3">
  <div class="col-lg-8">

    <!-- Général -->
    <div class="form-card mb-3">
      <h6 class="card-title"><i class="bi bi-info-circle me-1"></i>Informations générales</h6>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">SKU <span class="text-danger">*</span></label>
          <input class="form-control" [(ngModel)]="form.sku" name="sku" required>
        </div>
        <div class="col-md-6">
          <label class="form-label">Slug (URL) <span class="text-danger">*</span></label>
          <input class="form-control" [(ngModel)]="form.slug" name="slug" required>
        </div>
        <div class="col-md-6">
          <label class="form-label">Catégorie <span class="text-danger">*</span></label>
          <select class="form-select" [(ngModel)]="form.categoryId" name="categoryId" required>
            <option [ngValue]="''">— Choisir —</option>
            @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Marque</label>
          <select class="form-select" [(ngModel)]="form.brandId" name="brandId">
            <option [ngValue]="null">— Aucune —</option>
            @for (b of brands(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Prix <span class="text-danger">*</span></label>
          <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="form.basePrice" name="basePrice" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">Prix barré (promo)</label>
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
          <label class="form-label">Code-barres EAN</label>
          <input class="form-control" [(ngModel)]="form.barcode" name="barcode">
        </div>
      </div>
    </div>

    <!-- Traductions avec Quill -->
    <div class="form-card mb-3">
      <h6 class="card-title"><i class="bi bi-translate me-1"></i>Traductions (FR / AR / EN)</h6>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        @for (lc of ['fr','ar','en']; track lc) {
          <li class="nav-item">
            <button type="button" class="nav-link" [class.active]="activeLang() === lc" (click)="activeLang.set(lc)">
              @if (lc === 'fr') { 🇫🇷 Français <span class="text-danger">*</span> }
              @else if (lc === 'ar') { 🇸🇦 العربية }
              @else { 🇬🇧 English }
            </button>
          </li>
        }
      </ul>

      @for (lc of ['fr','ar','en']; track lc) {
        <div [class.d-none]="activeLang() !== lc">
          <div class="row g-3">
            <div class="col-md-12">
              <label class="form-label">Nom @if (lc === 'fr') {<span class="text-danger">*</span>}</label>
              <input class="form-control" [dir]="lc === 'ar' ? 'rtl' : 'ltr'"
                     [(ngModel)]="translations[lc].name" [name]="'tr-name-' + lc">
            </div>
            <div class="col-12">
              <label class="form-label">Description courte</label>
              <input class="form-control" [dir]="lc === 'ar' ? 'rtl' : 'ltr'"
                     [(ngModel)]="translations[lc].shortDescription" [name]="'tr-sd-' + lc"
                     placeholder="Ex: Hydratation 24h, formule coréenne...">
            </div>
            <div class="col-12">
              <label class="form-label">Description complète</label>
              <quill-editor [(ngModel)]="translations[lc].description"
                            [name]="'tr-desc-' + lc"
                            [modules]="quillModules"
                            [placeholder]="'Description détaillée du produit...'"
                            [styles]="{'min-height': '200px', 'background': '#fff'}"
                            [class.rtl-editor]="lc === 'ar'">
              </quill-editor>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Images avec drag & drop -->
    <div class="form-card mb-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="card-title mb-0"><i class="bi bi-images me-1"></i>Images (drag & drop pour réordonner)</h6>
        <button type="button" class="btn btn-sm btn-primary" (click)="addImage()">
          <i class="bi bi-plus"></i> Ajouter une image
        </button>
      </div>

      @if (images.length === 0) {
        <div class="empty-images">
          <i class="bi bi-image"></i>
          <p>Aucune image. Cliquez sur "Ajouter une image" et collez l'URL.</p>
        </div>
      } @else {
        <div cdkDropList (cdkDropListDropped)="dropImage($event)" class="image-list">
          @for (img of images; track $index; let i = $index) {
            <div class="image-row" cdkDrag>
              <div class="drag-handle" cdkDragHandle>
                <i class="bi bi-grip-vertical"></i>
              </div>
              <div class="image-preview">
                @if (img.url) {
                  <img [src]="img.url" alt="">
                } @else {
                  <i class="bi bi-image"></i>
                }
                @if (img.isPrimary) {
                  <span class="primary-badge">★ Principale</span>
                }
              </div>
              <div class="image-fields">
                <input class="form-control form-control-sm mb-2" placeholder="URL de l'image (https://...)"
                       [(ngModel)]="img.url" [name]="'img-url-' + i">
                <input class="form-control form-control-sm" placeholder="Texte alternatif (SEO + accessibilité)"
                       [(ngModel)]="img.altText" [name]="'img-alt-' + i">
              </div>
              <div class="image-actions">
                <button type="button" class="btn btn-sm" [class.btn-warning]="img.isPrimary" [class.btn-outline-secondary]="!img.isPrimary"
                        (click)="setPrimary(i)" title="Image principale">
                  <i class="bi" [class.bi-star-fill]="img.isPrimary" [class.bi-star]="!img.isPrimary"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeImage(i)" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>
        <small class="text-muted">
          <i class="bi bi-info-circle me-1"></i>
          Glisser les blocs avec l'icône <code>::</code> pour réordonner.
          L'étoile désigne l'image principale (affichée en vignette).
        </small>
      }
    </div>
  </div>

  <!-- Sidebar -->
  <div class="col-lg-4">
    <div class="form-card mb-3 sticky-card">
      <h6 class="card-title"><i class="bi bi-gear me-1"></i>Publication</h6>
      <div class="form-check form-switch mb-2">
        <input class="form-check-input" type="checkbox" id="p-active" [(ngModel)]="form.isActive" name="isActive">
        <label class="form-check-label" for="p-active">
          <strong>Actif</strong>
          <small class="d-block text-muted">Visible sur la boutique</small>
        </label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="p-featured" [(ngModel)]="form.isFeatured" name="isFeatured">
        <label class="form-check-label" for="p-featured">
          <strong>Coup de cœur</strong>
          <small class="d-block text-muted">Apparaît dans le slider d'accueil</small>
        </label>
      </div>

      <hr>

      <button type="submit" class="btn btn-primary w-100 btn-uppercase" [disabled]="saving()">
        @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
        @if (editingId()) { Mettre à jour } @else { Créer le produit }
      </button>
    </div>

    <div class="form-card">
      <h6 class="card-title"><i class="bi bi-code me-1"></i>Attributs personnalisés (JSON)</h6>
      <textarea class="form-control font-monospace" rows="6"
                [(ngModel)]="attributesText" name="attrs"
                placeholder='&#10;&#123;&#10;  "ingredients": "Vitamine C, Centella",&#10;  "volume_ml": 30,&#10;  "bio": true&#10;&#125;'>
      </textarea>
      <small class="text-muted">
        Spécifications libres par catégorie (composition, dimensions, etc.)
      </small>
    </div>
  </div>
</div>
</form>
}
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; align-items:end; margin-bottom:1.5rem; }
    .page-header h1 { font-family:'Playfair Display'; font-size:1.6rem; font-weight:600; margin:0; color:var(--velisse-brown); }
    .page-sub { color:#8B7068; font-size:.9rem; margin:0; }

    .form-card { background:#fff; border:1px solid #EDE4DE; border-radius:12px; padding:1.5rem; }
    .card-title { font-family:'Poppins'; font-weight:600; color:var(--velisse-brown);
                  text-transform:uppercase; font-size:.8rem; letter-spacing:.12em;
                  margin-bottom:1.25rem; padding-bottom:.75rem; border-bottom:1px solid #F5ECE7; }

    .sticky-card { position:sticky; top:90px; }

    /* Nav tabs */
    .nav-tabs { border-bottom-color:#EDE4DE; }
    .nav-tabs .nav-link { border:none; border-bottom:2px solid transparent; color:#8B7068; font-weight:500; padding:.7rem 1rem; background:transparent; }
    .nav-tabs .nav-link.active { color:#B88577; border-bottom-color:#B88577; background:transparent; }

    /* Quill */
    ::ng-deep quill-editor { display:block; }
    ::ng-deep .ql-toolbar { background:#FAF7F4; border-color:#EDE4DE !important; border-top-left-radius:6px; border-top-right-radius:6px; }
    ::ng-deep .ql-container { border-color:#EDE4DE !important; border-bottom-left-radius:6px; border-bottom-right-radius:6px; font-family:'Poppins'; }
    ::ng-deep .ql-editor { min-height:180px; }
    ::ng-deep .rtl-editor .ql-editor { direction:rtl; text-align:right; }

    /* Empty images */
    .empty-images { text-align:center; padding:2rem; background:#FDF7F4; border:2px dashed #F0DDD7; border-radius:8px; color:#8B7068; }
    .empty-images i { font-size:2.5rem; color:#D5C2BB; display:block; margin-bottom:.5rem; }
    .empty-images p { margin:0; font-size:.9rem; }

    /* Image list */
    .image-list { display:flex; flex-direction:column; gap:.65rem; margin-bottom:.5rem; }
    .image-row {
      display:flex; gap:.85rem; align-items:center;
      background:#fff; border:1px solid #EDE4DE; border-radius:8px; padding:.65rem;
      transition:all .15s;
    }
    .image-row:hover { background:#FDF7F4; border-color:#F0DDD7; }
    .image-row.cdk-drag-preview { box-shadow:0 8px 20px rgba(61,40,23,.15); }
    .image-row.cdk-drag-placeholder { opacity:.4; }
    .cdk-drop-list-dragging .image-row:not(.cdk-drag-placeholder) { transition:transform .25s; }

    .drag-handle {
      cursor:grab; color:#8B7068; font-size:1.2rem; padding:.3rem;
      display:flex; align-items:center;
    }
    .drag-handle:active { cursor:grabbing; }

    .image-preview {
      position:relative;
      width:64px; height:64px; flex-shrink:0;
      background:#FBE9E5; border-radius:6px; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
    }
    .image-preview img { width:100%; height:100%; object-fit:cover; }
    .image-preview i { font-size:1.5rem; color:#D5C2BB; }
    .primary-badge {
      position:absolute; bottom:0; left:0; right:0;
      background:rgba(184,133,119,.95); color:#fff;
      font-size:.6rem; text-align:center; padding:.1rem;
    }

    .image-fields { flex-grow:1; min-width:0; }
    .image-actions { display:flex; gap:.35rem; }

    code { color:#B88577; font-size:.9em; }
  `]
})
export class ProductFormComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  editingId = signal<string | null>(null);
  activeLang = signal<string>('fr');

  categories = signal<CategoryListItem[]>([]);
  brands = signal<Brand[]>([]);

  form = {
    sku: '', slug: '', categoryId: '', brandId: null as string | null,
    basePrice: 0, compareAtPrice: null as number | null, currency: 'MAD',
    stockQuantity: 0, lowStockThreshold: 5,
    weightKg: null as number | null, barcode: null as string | null,
    isActive: true, isFeatured: false
  };

  translations: Record<string, TransForm> = {
    fr: { name: '', shortDescription: '', description: '' },
    ar: { name: '', shortDescription: '', description: '' },
    en: { name: '', shortDescription: '', description: '' }
  };

  images: ImageForm[] = [];
  attributesText = '';

  quillModules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  constructor() {
    this.api.get<{ items: CategoryListItem[] }>('/admin/categories', { page: 1, pageSize: 100 })
      .subscribe(r => this.categories.set(r.items));
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
    this.attributesText = p.attributes ? JSON.stringify(p.attributes, null, 2) : '';
    this.loading.set(false);
  }

  addImage() {
    this.images = [...this.images, { url: '', altText: '', sortOrder: this.images.length, isPrimary: this.images.length === 0 }];
  }
  removeImage(i: number) {
    const wasPrimary = this.images[i].isPrimary;
    this.images = this.images.filter((_, idx) => idx !== i);
    if (wasPrimary && this.images.length > 0) this.images[0].isPrimary = true;
  }
  setPrimary(i: number) {
    this.images = this.images.map((img, idx) => ({ ...img, isPrimary: idx === i }));
  }
  dropImage(event: CdkDragDrop<ImageForm[]>) {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.images = this.images.map((img, idx) => ({ ...img, sortOrder: idx }));
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
        .map((i, idx) => ({ url: i.url, altText: i.altText || undefined, sortOrder: idx, isPrimary: i.isPrimary }))
    };

    if (!req.translations.length) { this.toast.error('Au moins une traduction (FR) est requise'); return; }
    if (!req.categoryId) { this.toast.error('Catégorie requise'); return; }

    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.api.put<ProductDetail>(`/admin/products/${id}`, req)
      : this.api.post<ProductDetail>('/admin/products', req);
    obs.subscribe({
      next: () => { this.toast.success(id ? 'Mis à jour ✓' : 'Créé ✓'); this.router.navigate(['/admin/products']); },
      error: (e: ApiException) => { this.toast.error(e.message); this.saving.set(false); }
    });
  }
}
