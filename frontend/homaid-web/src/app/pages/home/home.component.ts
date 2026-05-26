import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryTree, ProductListItem } from '../../core/models/catalog.models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
<!-- HERO -->
<section class="hero text-white text-center d-flex align-items-center">
  <div class="container py-5">
    <h1 class="display-4 fw-bold mb-3">Bienvenue sur Homaid Store</h1>
    <p class="lead mb-4">Votre boutique en ligne marocaine · paiement à la livraison · livraison rapide</p>
    <a routerLink="/catalog" class="btn btn-light btn-lg">
      <i class="bi bi-bag-fill me-2"></i>Découvrir le catalogue
    </a>
  </div>
</section>

<!-- CATÉGORIES -->
<section class="container my-5">
  <h2 class="text-center mb-4">Nos catégories</h2>
  @if (loadingCategories()) {
    <div class="text-center"><div class="spinner-border text-primary"></div></div>
  } @else {
    <div class="row g-3">
      @for (c of categories(); track c.id) {
        <div class="col-6 col-md-3">
          <a [routerLink]="['/catalog']" [queryParams]="{ category: c.slug }" class="card text-decoration-none text-center category-card h-100">
            <div class="card-body">
              @if (c.imageUrl) {
                <img [src]="c.imageUrl" [alt]="c.name" class="img-fluid mb-2" style="max-height: 80px">
              } @else {
                <i class="bi bi-grid-3x3-gap-fill display-4 text-primary"></i>
              }
              <h5 class="card-title mt-2 mb-0">{{ c.name }}</h5>
            </div>
          </a>
        </div>
      }
    </div>
  }
</section>

<!-- PRODUITS MIS EN AVANT -->
<section class="container my-5">
  <div class="d-flex align-items-center justify-content-between mb-4">
    <h2 class="mb-0">Produits en vedette</h2>
    <a routerLink="/catalog" class="btn btn-outline-primary btn-sm">
      Voir tout <i class="bi bi-arrow-right"></i>
    </a>
  </div>
  @if (loadingFeatured()) {
    <div class="text-center"><div class="spinner-border text-primary"></div></div>
  } @else {
    <div class="row g-3">
      @for (p of featured(); track p.id) {
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card h-100 product-card">
            <a [routerLink]="['/product', p.slug]" class="position-relative">
              @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                <span class="badge bg-danger position-absolute top-0 end-0 m-2">Promo</span>
              }
              <img [src]="p.primaryImageUrl || 'https://picsum.photos/seed/' + p.slug + '/400/400'"
                   [alt]="p.name" class="card-img-top" style="aspect-ratio: 1; object-fit: cover">
            </a>
            <div class="card-body d-flex flex-column">
              @if (p.brandName) {
                <small class="text-muted">{{ p.brandName }}</small>
              }
              <h6 class="card-title">
                <a [routerLink]="['/product', p.slug]" class="text-decoration-none text-dark">{{ p.name }}</a>
              </h6>
              <div class="mt-auto">
                <div class="d-flex align-items-baseline gap-2">
                  <span class="fw-bold text-primary">{{ p.basePrice | money:p.currency }}</span>
                  @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                    <small class="text-muted text-decoration-line-through">{{ p.compareAtPrice | money:p.currency }}</small>
                  }
                </div>
                <button class="btn btn-primary btn-sm w-100 mt-2"
                        [disabled]="!p.isInStock"
                        (click)="addToCart(p)">
                  @if (p.isInStock) {
                    <i class="bi bi-cart-plus"></i> Ajouter
                  } @else {
                    Rupture de stock
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  }
</section>

<!-- ARGUMENTS -->
<section class="bg-light py-5 my-5">
  <div class="container">
    <div class="row text-center g-4">
      <div class="col-md-4">
        <i class="bi bi-truck display-4 text-primary"></i>
        <h5 class="mt-2">Livraison rapide</h5>
        <p class="text-muted small mb-0">2 à 5 jours partout au Maroc</p>
      </div>
      <div class="col-md-4">
        <i class="bi bi-cash-coin display-4 text-primary"></i>
        <h5 class="mt-2">Paiement à la livraison</h5>
        <p class="text-muted small mb-0">Cash COD au Maroc, virement à l'international</p>
      </div>
      <div class="col-md-4">
        <i class="bi bi-shield-check display-4 text-primary"></i>
        <h5 class="mt-2">Paiement sécurisé</h5>
        <p class="text-muted small mb-0">Vos données protégées (RGPD + loi 09-08)</p>
      </div>
    </div>
  </div>
</section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, var(--homaid-primary) 0%, var(--homaid-primary-dark) 100%);
      min-height: 360px;
    }
    .category-card { transition: transform .15s, box-shadow .15s; cursor: pointer; }
    .category-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .product-card { transition: transform .15s, box-shadow .15s; }
    .product-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  `]
})
export class HomeComponent {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  private toast = inject(ToastService);

  categories = signal<CategoryTree[]>([]);
  featured = signal<ProductListItem[]>([]);
  loadingCategories = signal(true);
  loadingFeatured = signal(true);

  constructor() {
    this.catalog.getCategoryTree().subscribe({
      next: cs => { this.categories.set(cs); this.loadingCategories.set(false); },
      error: () => this.loadingCategories.set(false)
    });
    this.catalog.getFeatured(8).subscribe({
      next: ps => { this.featured.set(ps); this.loadingFeatured.set(false); },
      error: () => this.loadingFeatured.set(false)
    });
  }

  addToCart(p: ProductListItem): void {
    this.cart.add(p);
    this.toast.success(`${p.name} ajouté au panier`);
  }
}
