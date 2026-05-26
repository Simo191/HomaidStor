import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductDetail, ProductImage } from '../../core/models/catalog.models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
@if (loading()) {
  <div class="container my-5 text-center"><div class="spinner-border text-primary"></div></div>
} @else if (!product()) {
  <div class="container my-5">
    <div class="alert alert-warning">
      <i class="bi bi-exclamation-triangle me-2"></i>Produit introuvable.
      <a routerLink="/catalog" class="alert-link">Retour au catalogue</a>
    </div>
  </div>
} @else {
  <div class="container my-4">
    <!-- Breadcrumb -->
    <nav>
      <ol class="breadcrumb small">
        <li class="breadcrumb-item"><a routerLink="/">Accueil</a></li>
        <li class="breadcrumb-item"><a routerLink="/catalog">Catalogue</a></li>
        <li class="breadcrumb-item">
          <a [routerLink]="['/catalog']" [queryParams]="{ category: product()!.categorySlug }">
            {{ product()!.categoryName }}
          </a>
        </li>
        <li class="breadcrumb-item active">{{ product()!.name }}</li>
      </ol>
    </nav>

    <div class="row g-4">
      <!-- Galerie -->
      <div class="col-md-6">
        <div class="card border-0">
          @if (selectedImage()) {
            <img [src]="selectedImage()!.url" [alt]="product()!.name" class="card-img-top rounded mb-2"
                 style="aspect-ratio:1; object-fit:cover">
          } @else {
            <img [src]="'https://picsum.photos/seed/' + product()!.slug + '/600/600'" [alt]="product()!.name"
                 class="card-img-top rounded mb-2" style="aspect-ratio:1; object-fit:cover">
          }
          @if (product()!.images.length > 1) {
            <div class="d-flex gap-2 flex-wrap">
              @for (img of product()!.images; track img.id) {
                <img [src]="img.url" [alt]="img.altText || product()!.name"
                     class="img-thumbnail" style="width:70px; height:70px; object-fit:cover; cursor:pointer"
                     [class.border-primary]="img.id === selectedImage()?.id"
                     [class.border-2]="img.id === selectedImage()?.id"
                     (click)="selectImage(img)">
              }
            </div>
          }
        </div>
      </div>

      <!-- Infos -->
      <div class="col-md-6">
        @if (product()!.brandName) {
          <small class="text-muted text-uppercase">{{ product()!.brandName }}</small>
        }
        <h1 class="h2 mt-1">{{ product()!.name }}</h1>
        @if (product()!.shortDescription) {
          <p class="lead text-muted">{{ product()!.shortDescription }}</p>
        }

        <!-- Prix -->
        <div class="my-3 d-flex align-items-baseline gap-3">
          <span class="display-6 text-primary fw-bold">{{ product()!.basePrice | money:product()!.currency }}</span>
          @if (product()!.compareAtPrice && product()!.compareAtPrice! > product()!.basePrice) {
            <span class="text-muted text-decoration-line-through">{{ product()!.compareAtPrice! | money:product()!.currency }}</span>
            <span class="badge bg-danger">-{{ discount() }}%</span>
          }
        </div>

        <!-- Stock -->
        <p class="mb-3">
          @if (product()!.isInStock) {
            <span class="text-success"><i class="bi bi-check-circle-fill"></i> En stock ({{ product()!.stockQuantity }} disponibles)</span>
          } @else {
            <span class="text-danger"><i class="bi bi-x-circle-fill"></i> Rupture de stock</span>
          }
        </p>

        <!-- SKU -->
        <p class="text-muted small mb-3">SKU : <code>{{ product()!.sku }}</code></p>

        <!-- Quantity + Add -->
        @if (product()!.isInStock) {
          <div class="d-flex gap-2 mb-4 align-items-stretch">
            <div class="input-group" style="max-width:140px">
              <button class="btn btn-outline-secondary" type="button" (click)="dec()">−</button>
              <input type="number" class="form-control text-center" [(ngModel)]="quantity" min="1" [max]="product()!.stockQuantity">
              <button class="btn btn-outline-secondary" type="button" (click)="inc()">+</button>
            </div>
            <button class="btn btn-primary flex-grow-1" (click)="addToCart()">
              <i class="bi bi-cart-plus"></i> Ajouter au panier
            </button>
          </div>
        }

        <!-- Description -->
        @if (product()!.description) {
          <hr>
          <h5>Description</h5>
          <div class="text-muted">{{ product()!.description }}</div>
        }

        <!-- Attributs JSON -->
        @if (attributesList().length > 0) {
          <hr>
          <h5>Caractéristiques</h5>
          <dl class="row small">
            @for (a of attributesList(); track a.key) {
              <dt class="col-5 text-muted">{{ a.key }}</dt>
              <dd class="col-7">{{ a.value }}</dd>
            }
          </dl>
        }

        @if (product()!.weightKg) {
          <p class="small text-muted"><i class="bi bi-box-seam"></i> Poids : {{ product()!.weightKg }} kg</p>
        }
      </div>
    </div>
  </div>
}
  `
})
export class ProductDetailComponent {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product = signal<ProductDetail | null>(null);
  selectedImage = signal<ProductImage | null>(null);
  loading = signal(true);
  quantity = 1;

  constructor() {
    this.route.paramMap.subscribe(p => {
      const slug = p.get('slug');
      if (!slug) { this.router.navigate(['/catalog']); return; }
      this.loading.set(true);
      this.catalog.getProduct(slug).subscribe({
        next: prod => {
          this.product.set(prod);
          this.selectedImage.set(prod.images.find(i => i.isPrimary) || prod.images[0] || null);
          this.quantity = 1;
          this.loading.set(false);
        },
        error: () => { this.product.set(null); this.loading.set(false); }
      });
    });
  }

  discount = computed(() => {
    const p = this.product();
    if (!p?.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round(100 * (p.compareAtPrice - p.basePrice) / p.compareAtPrice);
  });

  attributesList = computed(() => {
    const attrs = this.product()?.attributes;
    if (!attrs || typeof attrs !== 'object') return [];
    return Object.entries(attrs).map(([key, value]) => ({ key, value: String(value) }));
  });

  selectImage(img: ProductImage): void { this.selectedImage.set(img); }

  inc(): void {
    const max = this.product()?.stockQuantity ?? 1;
    this.quantity = Math.min(max, this.quantity + 1);
  }
  dec(): void { this.quantity = Math.max(1, this.quantity - 1); }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cart.add(p, this.quantity);
    this.toast.success(`${this.quantity} × ${p.name} ajouté au panier`);
  }
}
