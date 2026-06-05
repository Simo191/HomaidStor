import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CategoryTree, ProductListItem } from '../../core/models/catalog.models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { HeroSliderComponent } from './hero-slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, HeroSliderComponent, TranslatePipe],
  template: `
<!-- HERO SLIDER : 5 produits coup de cœur sélectionnés en admin -->
@if (heroProducts().length > 0) {
  <app-hero-slider [products]="heroProducts()"></app-hero-slider>
} @else {
  <!-- Fallback hero statique si aucun produit en vedette -->
  <section class="hero-banner">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-md-7">
          <div class="section-sub mb-2" style="color:var(--velisse-rose-gold); letter-spacing:.35em; font-size:.78rem; text-transform:uppercase; font-weight:500">
            {{ 'home.hero_eyebrow' | translate }}
          </div>
          <h1 class="mb-3" style="color:var(--velisse-brown)">
            {{ 'home.hero_title_1' | translate }}<br>
            <span style="color:var(--velisse-rose-gold); font-style:italic">{{ 'home.hero_title_2' | translate }}</span>
          </h1>
          <p class="lead mb-4">{{ 'home.hero_lead' | translate }}</p>
          <div class="d-flex flex-wrap gap-3">
            <a routerLink="/catalog" class="btn btn-dark btn-lg btn-uppercase">
              {{ 'home.cta_discover' | translate }} <i class="bi bi-arrow-right ms-2"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
}

<!-- USP BAR -->
<section class="bg-light py-4 border-bottom">
  <div class="container">
    <div class="row text-center g-3">
      <div class="col-6 col-md-3">
        <i class="bi bi-truck" style="font-size:1.5rem; color:var(--homaid-primary)"></i>
        <div class="small mt-1"><strong>{{ 'home.usp_delivery' | translate }}</strong></div>
        <small class="text-muted">{{ 'home.usp_delivery_sub' | translate }}</small>
      </div>
      <div class="col-6 col-md-3">
        <i class="bi bi-cash-coin" style="font-size:1.5rem; color:var(--homaid-primary)"></i>
        <div class="small mt-1"><strong>{{ 'home.usp_payment' | translate }}</strong></div>
        <small class="text-muted">{{ 'home.usp_payment_sub' | translate }}</small>
      </div>
      <div class="col-6 col-md-3">
        <i class="bi bi-shield-check" style="font-size:1.5rem; color:var(--homaid-primary)"></i>
        <div class="small mt-1"><strong>{{ 'home.usp_authentic' | translate }}</strong></div>
        <small class="text-muted">{{ 'home.usp_authentic_sub' | translate }}</small>
      </div>
      <div class="col-6 col-md-3">
        <i class="bi bi-headset" style="font-size:1.5rem; color:var(--homaid-primary)"></i>
        <div class="small mt-1"><strong>{{ 'home.usp_support' | translate }}</strong></div>
        <small class="text-muted">{{ 'home.usp_support_sub' | translate }}</small>
      </div>
    </div>
  </div>
</section>

<!-- CATÉGORIES (mosaïque) -->
<section class="container">
  <div class="section-title">
    <div class="section-sub">{{ 'home.categories_eyebrow' | translate }}</div>
    <h2>{{ 'home.categories_title' | translate }}</h2>
    <div class="section-line"><i class="bi bi-flower2"></i></div>
  </div>
  @if (loadingCategories()) {
    <div class="text-center"><div class="spinner-border" style="color:var(--homaid-primary)"></div></div>
  } @else {
    <div class="row g-3">
      @for (c of categories(); track c.id) {
        <div class="col-6 col-md-3">
          <a [routerLink]="['/catalog']" [queryParams]="{ category: c.slug }" class="category-tile d-block text-decoration-none">
            <img [src]="c.imageUrl || ('https://picsum.photos/seed/cat-' + c.slug + '/400/400')" [alt]="c.name">
            <div class="category-overlay">
              <span class="category-name">{{ c.name }}</span>
            </div>
          </a>
        </div>
      }
    </div>
  }
</section>

<!-- PRODUITS EN VEDETTE -->
<section class="container">
  <div class="section-title">
    <div class="section-sub">{{ 'home.trending_eyebrow' | translate }}</div>
    <h2>{{ 'home.trending_title' | translate }}</h2>
    <div class="section-line"><i class="bi bi-flower2"></i></div>
  </div>
  @if (loadingFeatured()) {
    <div class="text-center"><div class="spinner-border" style="color:var(--homaid-primary)"></div></div>
  } @else {
    <div class="row g-4">
      @for (p of featured(); track p.id) {
        <div class="col-6 col-md-3">
          <article class="product-card position-relative">
            <div class="product-img-wrap">
              <a [routerLink]="['/product', p.slug]">
                <img [src]="p.primaryImageUrl || 'https://picsum.photos/seed/' + p.slug + '/500/500'" [alt]="p.name">
              </a>
              <div class="product-badges">
                @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                  <span class="badge bg-sale">-{{ discount(p) }}%</span>
                }
                @if (!p.isInStock) {
                  <span class="badge bg-dark">{{ 'product.out_of_stock' | translate }}</span>
                }
              </div>
              <div class="product-quick">
                <button class="btn btn-light btn-sm w-100 btn-uppercase"
                        [disabled]="!p.isInStock"
                        (click)="addToCart(p)">
                  <i class="bi bi-bag-plus me-1"></i> {{ 'product.add_to_cart' | translate }}
                </button>
              </div>
            </div>
            <div class="product-info">
              @if (p.brandName) { <div class="product-brand">{{ p.brandName }}</div> }
              <a [routerLink]="['/product', p.slug]" class="text-decoration-none">
                <h3 class="product-name">{{ p.name }}</h3>
              </a>
              <div class="product-price">
                {{ p.basePrice | money:p.currency }}
                @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                  <span class="product-price-old">{{ p.compareAtPrice | money:p.currency }}</span>
                }
              </div>
            </div>
          </article>
        </div>
      }
    </div>
    <div class="text-center mt-4">
      <a routerLink="/catalog" class="btn btn-outline-dark btn-uppercase">
        {{ 'home.view_all' | translate }} <i class="bi bi-arrow-right ms-2"></i>
      </a>
    </div>
  }
</section>

<!-- NEWSLETTER -->
<section class="my-5 py-5" style="background:var(--homaid-bg-soft)">
  <div class="container text-center">
    <div class="row justify-content-center">
      <div class="col-md-7">
        <div class="section-sub mb-2">{{ 'home.rejoin_eyebrow' | translate }}</div>
        <h2 class="mb-3">{{ 'footer.subscription_title' | translate }}</h2>
        <p class="text-muted mb-4">{{ 'footer.subscription_text' | translate }}</p>
        <form class="d-flex justify-content-center gap-2 flex-wrap" (submit)="$event.preventDefault()">
          <input type="email" class="form-control" [placeholder]="'footer.newsletter_placeholder' | translate" style="max-width:340px">
          <button class="btn btn-primary btn-uppercase">{{ 'footer.subscribe' | translate }}</button>
        </form>
      </div>
    </div>
  </div>
</section>
  `
})
export class HomeComponent {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  categories = signal<CategoryTree[]>([]);
  featured = signal<ProductListItem[]>([]);
  loadingCategories = signal(true);
  loadingFeatured = signal(true);

  /** Les 5 premiers produits "Coup de cœur" pour le slider hero */
  heroProducts = computed(() => this.featured().slice(0, 5));

  constructor() {
    this.catalog.getCategoryTree().subscribe({
      next: cs => { this.categories.set(cs.slice(0, 8)); this.loadingCategories.set(false); },
      error: () => this.loadingCategories.set(false)
    });
    this.catalog.getFeatured(8).subscribe({
      next: ps => { this.featured.set(ps); this.loadingFeatured.set(false); },
      error: () => this.loadingFeatured.set(false)
    });
  }

  discount(p: ProductListItem): number {
    if (!p.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round(100 * (p.compareAtPrice - p.basePrice) / p.compareAtPrice);
  }

  addToCart(p: ProductListItem): void {
    this.cart.add(p);
    this.toast.success(`${p.name} ${this.translate.instant('cart.added')}`);
  }
}
