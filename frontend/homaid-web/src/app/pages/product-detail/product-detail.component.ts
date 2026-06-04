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
    <div class="alert text-center" style="background:var(--velisse-rose-light); color:var(--velisse-brown); border:none">
      <i class="bi bi-exclamation-circle me-2"></i>Produit introuvable.
      <a routerLink="/catalog" class="alert-link ms-2" style="color:var(--velisse-rose-gold)">Retour au catalogue</a>
    </div>
  </div>
} @else {
  <div class="container my-4 my-md-5">
    <!-- Breadcrumb -->
    <nav class="mb-4">
      <ol class="breadcrumb small mb-0" style="background:transparent">
        <li class="breadcrumb-item"><a routerLink="/" style="color:var(--velisse-muted)">Accueil</a></li>
        <li class="breadcrumb-item"><a routerLink="/catalog" style="color:var(--velisse-muted)">Catalogue</a></li>
        <li class="breadcrumb-item">
          <a [routerLink]="['/catalog']" [queryParams]="{ category: product()!.categorySlug }" style="color:var(--velisse-muted)">
            {{ product()!.categoryName }}
          </a>
        </li>
        <li class="breadcrumb-item active" style="color:var(--velisse-text)">{{ product()!.name }}</li>
      </ol>
    </nav>

    <div class="row g-4 g-md-5">
      <!-- Galerie -->
      <div class="col-md-6">
        <div class="position-relative" style="background:var(--velisse-rose-bg)">
          @if (selectedImage()) {
            <img [src]="selectedImage()!.url" [alt]="product()!.name" class="w-100"
                 style="aspect-ratio:1; object-fit:cover">
          } @else {
            <img [src]="'https://picsum.photos/seed/' + product()!.slug + '/700/700'" [alt]="product()!.name"
                 class="w-100" style="aspect-ratio:1; object-fit:cover">
          }
          <!-- Badges -->
          <div class="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2">
            @if (discount() > 0) {
              <span class="badge bg-sale">-{{ discount() }}%</span>
            }
            @if (!product()!.isInStock) {
              <span class="badge bg-dark">Rupture</span>
            }
          </div>
        </div>
        @if (product()!.images.length > 1) {
          <div class="d-flex gap-2 flex-wrap mt-3">
            @for (img of product()!.images; track img.id) {
              <img [src]="img.url" [alt]="img.altText || product()!.name"
                   class="img-thumbnail" style="width:78px; height:78px; object-fit:cover; cursor:pointer; border-radius:0"
                   [style.border-color]="img.id === selectedImage()?.id ? 'var(--velisse-rose-gold)' : 'var(--velisse-border)'"
                   [style.border-width]="img.id === selectedImage()?.id ? '2px' : '1px'"
                   (click)="selectImage(img)">
            }
          </div>
        }
      </div>

      <!-- Infos -->
      <div class="col-md-6">
        @if (product()!.brandName) {
          <div class="mb-2" style="font-size:.75rem; letter-spacing:.18em; text-transform:uppercase; color:var(--velisse-rose-gold); font-weight:500">
            {{ product()!.brandName }}
          </div>
        }
        <h1 class="mb-2" style="font-size:clamp(1.75rem, 3vw, 2.5rem); font-weight:500">{{ product()!.name }}</h1>
        @if (product()!.shortDescription) {
          <p class="lead" style="color:var(--velisse-muted); font-size:1.05rem">{{ product()!.shortDescription }}</p>
        }

        <div class="divider-fancy"></div>

        <!-- Prix -->
        <div class="my-3 d-flex align-items-baseline gap-3">
          <span style="font-size:2rem; font-weight:600; color:var(--velisse-rose-gold)">
            {{ product()!.basePrice | money:product()!.currency }}
          </span>
          @if (product()!.compareAtPrice && product()!.compareAtPrice! > product()!.basePrice) {
            <span style="text-decoration:line-through; color:var(--velisse-muted)">
              {{ product()!.compareAtPrice! | money:product()!.currency }}
            </span>
            <span class="badge bg-sale">Économisez {{ discount() }}%</span>
          }
        </div>

        <!-- Stock -->
        <p class="mb-3 small">
          @if (product()!.isInStock) {
            <i class="bi bi-check-circle-fill" style="color:var(--velisse-rose-gold)"></i>
            <span class="ms-1"><strong>En stock</strong> · {{ product()!.stockQuantity }} disponibles</span>
          } @else {
            <i class="bi bi-x-circle-fill text-danger"></i>
            <span class="ms-1 text-danger"><strong>Rupture de stock</strong></span>
          }
        </p>

        <p class="small" style="color:var(--velisse-muted)">
          Référence : <code style="color:var(--velisse-brown)">{{ product()!.sku }}</code>
        </p>

        <!-- Quantity + Add -->
        @if (product()!.isInStock) {
          <div class="d-flex gap-2 my-4 align-items-stretch">
            <div class="input-group" style="max-width:140px">
              <button class="btn btn-outline-dark" type="button" (click)="dec()">−</button>
              <input type="number" class="form-control text-center" [(ngModel)]="quantity" min="1" [max]="product()!.stockQuantity">
              <button class="btn btn-outline-dark" type="button" (click)="inc()">+</button>
            </div>
            <button class="btn btn-primary flex-grow-1 btn-uppercase" (click)="addToCart()">
              <i class="bi bi-bag-plus me-2"></i> Ajouter au panier
            </button>
          </div>
        }

        <!-- Garanties -->
        <div class="row g-2 small mt-4">
          <div class="col-6">
            <div class="d-flex gap-2 align-items-center p-2" style="background:var(--velisse-rose-bg)">
              <i class="bi bi-truck" style="color:var(--velisse-rose-gold); font-size:1.25rem"></i>
              <div><strong>Livraison rapide</strong><br><small style="color:var(--velisse-muted)">2-5 jours au Maroc</small></div>
            </div>
          </div>
          <div class="col-6">
            <div class="d-flex gap-2 align-items-center p-2" style="background:var(--velisse-rose-bg)">
              <i class="bi bi-cash-coin" style="color:var(--velisse-rose-gold); font-size:1.25rem"></i>
              <div><strong>Paiement à la livraison</strong><br><small style="color:var(--velisse-muted)">Cash COD</small></div>
            </div>
          </div>
          <div class="col-6">
            <div class="d-flex gap-2 align-items-center p-2" style="background:var(--velisse-rose-bg)">
              <i class="bi bi-shield-check" style="color:var(--velisse-rose-gold); font-size:1.25rem"></i>
              <div><strong>100% authentique</strong><br><small style="color:var(--velisse-muted)">Produits garantis</small></div>
            </div>
          </div>
          <div class="col-6">
            <div class="d-flex gap-2 align-items-center p-2" style="background:var(--velisse-rose-bg)">
              <i class="bi bi-arrow-counterclockwise" style="color:var(--velisse-rose-gold); font-size:1.25rem"></i>
              <div><strong>Retour 7 jours</strong><br><small style="color:var(--velisse-muted)">Satisfait ou remboursé</small></div>
            </div>
          </div>
        </div>

        <!-- Description -->
        @if (product()!.description) {
          <div class="mt-5">
            <h5 style="font-size:1rem; text-transform:uppercase; letter-spacing:.14em; font-family:'Poppins'; font-weight:500; margin-bottom:1rem;">
              <i class="bi bi-flower2 me-2" style="color:var(--velisse-rose-gold)"></i> Description
            </h5>
            <div style="line-height:1.7; color:var(--velisse-muted)">{{ product()!.description }}</div>
          </div>
        }

        <!-- Attributs JSON -->
        @if (attributesList().length > 0) {
          <div class="mt-4">
            <h5 style="font-size:1rem; text-transform:uppercase; letter-spacing:.14em; font-family:'Poppins'; font-weight:500; margin-bottom:1rem;">
              <i class="bi bi-list-ul me-2" style="color:var(--velisse-rose-gold)"></i> Caractéristiques
            </h5>
            <table class="table table-sm">
              <tbody>
                @for (a of attributesList(); track a.key) {
                  <tr>
                    <th style="width:40%; color:var(--velisse-muted); text-transform:capitalize; font-weight:500;">{{ a.key }}</th>
                    <td>{{ a.value }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (product()!.weightKg) {
          <p class="small mt-2" style="color:var(--velisse-muted)">
            <i class="bi bi-box-seam"></i> Poids : {{ product()!.weightKg }} kg
          </p>
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
