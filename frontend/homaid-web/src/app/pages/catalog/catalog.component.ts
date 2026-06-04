import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PagedResult } from '../../core/models/api.models';
import { Brand, CategoryListItem, ProductListItem, ProductListQuery } from '../../core/models/catalog.models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
<div class="container my-4">
  <div class="row g-4">

    <!-- SIDEBAR FILTRES -->
    <aside class="col-lg-3">
      <div class="card sticky-top" style="top:80px">
        <div class="card-body">
          <h5 class="mb-3"><i class="bi bi-funnel-fill text-primary"></i> Filtres</h5>

          <!-- Search -->
          <div class="mb-3">
            <label class="form-label small fw-bold">Recherche</label>
            <input type="search" class="form-control form-control-sm" placeholder="Nom, SKU..."
                   [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
          </div>

          <!-- Categories -->
          <div class="mb-3">
            <label class="form-label small fw-bold">Catégorie</label>
            <select class="form-select form-select-sm" [(ngModel)]="filters.categorySlug" (ngModelChange)="onFilterChange()">
              <option [ngValue]="undefined">Toutes les catégories</option>
              @for (c of categories(); track c.id) {
                <option [ngValue]="c.slug">{{ c.name }} ({{ c.productCount }})</option>
              }
            </select>
          </div>

          <!-- Brand -->
          <div class="mb-3">
            <label class="form-label small fw-bold">Marque</label>
            <select class="form-select form-select-sm" [(ngModel)]="filters.brandSlug" (ngModelChange)="onFilterChange()">
              <option [ngValue]="undefined">Toutes les marques</option>
              @for (b of brands(); track b.id) {
                <option [ngValue]="b.slug">{{ b.name }}</option>
              }
            </select>
          </div>

          <!-- Price range -->
          <div class="mb-3">
            <label class="form-label small fw-bold">Prix (MAD)</label>
            <div class="d-flex gap-2">
              <input type="number" class="form-control form-control-sm" placeholder="Min"
                     [(ngModel)]="filters.minPrice" (ngModelChange)="onFilterChange()">
              <input type="number" class="form-control form-control-sm" placeholder="Max"
                     [(ngModel)]="filters.maxPrice" (ngModelChange)="onFilterChange()">
            </div>
          </div>

          <!-- Stock & Featured -->
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="inStock"
                   [(ngModel)]="filters.inStockOnly" (ngModelChange)="onFilterChange()">
            <label class="form-check-label small" for="inStock">En stock uniquement</label>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="featured"
                   [(ngModel)]="filters.featuredOnly" (ngModelChange)="onFilterChange()">
            <label class="form-check-label small" for="featured">Coup de cœur</label>
          </div>

          <button class="btn btn-outline-secondary btn-sm w-100" (click)="resetFilters()">
            <i class="bi bi-x-circle"></i> Réinitialiser
          </button>
        </div>
      </div>
    </aside>

    <!-- LISTE PRODUITS -->
    <section class="col-lg-9">

      <!-- Toolbar -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-muted small">
          @if (page()) {
            <strong>{{ page()!.totalCount }}</strong> produit(s)
          }
        </span>
        <div class="d-flex gap-2 align-items-center">
          <label class="form-label small mb-0">Trier :</label>
          <select class="form-select form-select-sm" style="width:auto" [(ngModel)]="filters.sortBy" (ngModelChange)="onFilterChange()">
            <option value="newest">Nouveautés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="popular">Popularité</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      } @else if (!page() || page()!.items.length === 0) {
        <div class="alert alert-info text-center">
          <i class="bi bi-search me-2"></i>Aucun produit ne correspond à vos critères.
        </div>
      } @else {
        <div class="row g-4">
          @for (p of page()!.items; track p.id) {
            <div class="col-6 col-md-4">
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
                      <span class="badge bg-dark">Rupture</span>
                    }
                  </div>
                  <div class="product-quick">
                    <button class="btn btn-light btn-sm w-100 btn-uppercase"
                            [disabled]="!p.isInStock"
                            (click)="addToCart(p)">
                      <i class="bi bi-bag-plus me-1"></i>
                      @if (p.isInStock) { Ajouter } @else { Indisponible }
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

        <!-- Pagination -->
        @if (page()!.totalPages > 1) {
          <nav class="mt-4">
            <ul class="pagination justify-content-center">
              <li class="page-item" [class.disabled]="!page()!.hasPrevious">
                <button class="page-link" (click)="goToPage(page()!.page - 1)">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              @for (n of pageNumbers(); track n) {
                <li class="page-item" [class.active]="n === page()!.page">
                  <button class="page-link" (click)="goToPage(n)">{{ n }}</button>
                </li>
              }
              <li class="page-item" [class.disabled]="!page()!.hasNext">
                <button class="page-link" (click)="goToPage(page()!.page + 1)">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        }
      }
    </section>
  </div>
</div>
  `,
  styles: [`
    .product-card { transition: transform .15s, box-shadow .15s; }
    .product-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  `]
})
export class CatalogComponent {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categories = signal<CategoryListItem[]>([]);
  brands = signal<Brand[]>([]);
  page = signal<PagedResult<ProductListItem> | null>(null);
  loading = signal(true);

  filters: ProductListQuery & { categorySlug?: string; brandSlug?: string } = {
    search: undefined,
    categorySlug: undefined,
    brandSlug: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStockOnly: undefined,
    featuredOnly: undefined,
    sortBy: 'newest',
    page: 1,
    pageSize: 12
  };

  pageNumbers = computed(() => {
    const p = this.page();
    if (!p) return [];
    const current = p.page;
    const total = p.totalPages;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.catalog.getCategoriesFlat().subscribe(cs => this.categories.set(cs));
    this.catalog.getBrands().subscribe(bs => this.brands.set(bs));

    this.route.queryParams.subscribe(q => {
      this.filters = {
        ...this.filters,
        search: q['search'] || undefined,
        categorySlug: q['category'] || undefined,
        brandSlug: q['brand'] || undefined,
        minPrice: q['minPrice'] ? Number(q['minPrice']) : undefined,
        maxPrice: q['maxPrice'] ? Number(q['maxPrice']) : undefined,
        inStockOnly: q['inStock'] === 'true' ? true : undefined,
        featuredOnly: q['featured'] === 'true' ? true : undefined,
        sortBy: q['sort'] || 'newest',
        page: q['page'] ? Number(q['page']) : 1
      };
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.catalog.getProducts(this.filters).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => { this.page.set(null); this.loading.set(false); }
    });
  }

  onFilterChange(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.filters.page = 1;
      this.updateUrl();
    }, 300);
  }

  goToPage(n: number): void {
    const p = this.page();
    if (!p) return;
    if (n < 1 || n > p.totalPages) return;
    this.filters.page = n;
    this.updateUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateUrl(): void {
    const params: Record<string, string> = {};
    if (this.filters.search) params['search'] = this.filters.search;
    if (this.filters.categorySlug) params['category'] = this.filters.categorySlug;
    if (this.filters.brandSlug) params['brand'] = this.filters.brandSlug;
    if (this.filters.minPrice != null) params['minPrice'] = String(this.filters.minPrice);
    if (this.filters.maxPrice != null) params['maxPrice'] = String(this.filters.maxPrice);
    if (this.filters.inStockOnly) params['inStock'] = 'true';
    if (this.filters.featuredOnly) params['featured'] = 'true';
    if (this.filters.sortBy && this.filters.sortBy !== 'newest') params['sort'] = this.filters.sortBy;
    if ((this.filters.page ?? 1) > 1) params['page'] = String(this.filters.page);
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'replace' });
  }

  resetFilters(): void {
    this.filters = { sortBy: 'newest', page: 1, pageSize: 12 };
    this.updateUrl();
  }

  discount(p: ProductListItem): number {
    if (!p.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round(100 * (p.compareAtPrice - p.basePrice) / p.compareAtPrice);
  }

  addToCart(p: ProductListItem): void {
    this.cart.add(p);
    this.toast.success(`${p.name} ajouté au panier`);
  }
}
