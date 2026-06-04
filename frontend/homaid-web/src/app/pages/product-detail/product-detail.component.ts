import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductDetail, ProductImage, ProductListItem } from '../../core/models/catalog.models';
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
  <div class="container my-3 my-md-5">

    <!-- Breadcrumb -->
    <nav class="mb-3 mb-md-4">
      <ol class="breadcrumb small mb-0" style="background:transparent">
        <li class="breadcrumb-item"><a routerLink="/" style="color:var(--velisse-muted)">Accueil</a></li>
        <li class="breadcrumb-item d-none d-md-block"><a routerLink="/catalog" style="color:var(--velisse-muted)">Catalogue</a></li>
        <li class="breadcrumb-item">
          <a [routerLink]="['/catalog']" [queryParams]="{ category: product()!.categorySlug }" style="color:var(--velisse-muted)">
            {{ product()!.categoryName }}
          </a>
        </li>
        <li class="breadcrumb-item active text-truncate" style="color:var(--velisse-text); max-width:50%">{{ product()!.name }}</li>
      </ol>
    </nav>

    <div class="row g-4 g-md-5">
      <!-- Galerie -->
      <div class="col-12 col-md-6">
        <div class="product-gallery position-relative">
          @if (selectedImage()) {
            <img [src]="selectedImage()!.url" [alt]="product()!.name" class="main-image">
          } @else {
            <img [src]="'https://picsum.photos/seed/' + product()!.slug + '/700/700'" [alt]="product()!.name" class="main-image">
          }
          <div class="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2">
            @if (discount() > 0) { <span class="badge bg-sale">-{{ discount() }}%</span> }
            @if (!product()!.isInStock) { <span class="badge bg-dark">Rupture</span> }
          </div>
        </div>
        @if (product()!.images.length > 1) {
          <div class="d-flex gap-2 mt-3 thumbnail-strip">
            @for (img of product()!.images; track img.id) {
              <img [src]="img.url" [alt]="img.altText || product()!.name"
                   class="thumbnail" [class.active]="img.id === selectedImage()?.id" (click)="selectImage(img)">
            }
          </div>
        }
      </div>

      <!-- Infos -->
      <div class="col-12 col-md-6">
        @if (product()!.brandName) {
          <div class="mb-2 brand-label">{{ product()!.brandName }}</div>
        }
        <h1 class="product-title">{{ product()!.name }}</h1>

        <!-- Rating placeholder -->
        <div class="d-flex align-items-center gap-2 mb-3 small flex-wrap">
          <span class="star-display">
            <i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i>
          </span>
          <a href="#reviews" style="color:var(--velisse-muted); text-decoration:none" (click)="scrollToReviews($event)">
            (Soyez le premier à donner votre avis)
          </a>
        </div>

        @if (product()!.shortDescription) {
          <p class="lead short-desc">{{ product()!.shortDescription }}</p>
        }

        <hr style="border-color:var(--velisse-border)">

        <!-- Prix -->
        <div class="my-3 d-flex align-items-baseline gap-3 flex-wrap">
          <span class="price-main">{{ product()!.basePrice | money:product()!.currency }}</span>
          @if (product()!.compareAtPrice && product()!.compareAtPrice! > product()!.basePrice) {
            <span class="price-old">{{ product()!.compareAtPrice! | money:product()!.currency }}</span>
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
          <div class="d-flex gap-2 my-4 align-items-stretch flex-wrap">
            <div class="input-group" style="max-width:140px">
              <button class="btn btn-outline-dark" type="button" (click)="dec()">−</button>
              <input type="number" class="form-control text-center" [(ngModel)]="quantity" min="1" [max]="product()!.stockQuantity">
              <button class="btn btn-outline-dark" type="button" (click)="inc()">+</button>
            </div>
            <button class="btn btn-primary flex-grow-1 btn-uppercase" (click)="addToCart()">
              <i class="bi bi-bag-plus me-2"></i> Ajouter au panier
            </button>
          </div>
          <button class="btn btn-dark w-100 btn-uppercase mb-3" (click)="buyNow()">
            <i class="bi bi-lightning-charge me-2"></i> Acheter maintenant
          </button>
        }

        <!-- Wishlist + share -->
        <div class="d-flex gap-3 small mb-3">
          <button class="btn-link-soft"><i class="bi bi-heart me-1"></i> Ajouter aux favoris</button>
          <button class="btn-link-soft" (click)="share()"><i class="bi bi-share me-1"></i> Partager</button>
        </div>

        <!-- Garanties -->
        <div class="row g-2 mt-3">
          <div class="col-6"><div class="usp-tile"><i class="bi bi-truck"></i><div><strong>Livraison rapide</strong><br><small>2-5j au Maroc</small></div></div></div>
          <div class="col-6"><div class="usp-tile"><i class="bi bi-cash-coin"></i><div><strong>Paiement livraison</strong><br><small>Cash COD</small></div></div></div>
          <div class="col-6"><div class="usp-tile"><i class="bi bi-shield-check"></i><div><strong>100% authentique</strong><br><small>Produits garantis</small></div></div></div>
          <div class="col-6"><div class="usp-tile"><i class="bi bi-arrow-counterclockwise"></i><div><strong>Retour 7 jours</strong><br><small>Satisfait ou remboursé</small></div></div></div>
        </div>
      </div>
    </div>

    <!-- TABS : Description / Caractéristiques / Livraison -->
    <section class="mt-5 product-tabs">
      <ul class="nav nav-tabs flex-nowrap" style="overflow-x:auto">
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'desc'" (click)="activeTab.set('desc')">
            <i class="bi bi-file-text me-1"></i> Description
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'specs'" (click)="activeTab.set('specs')">
            <i class="bi bi-list-ul me-1"></i> Caractéristiques
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'shipping'" (click)="activeTab.set('shipping')">
            <i class="bi bi-truck me-1"></i> Livraison
          </button>
        </li>
      </ul>
      <div class="tab-content p-3 p-md-4">
        @if (activeTab() === 'desc') {
          <div>
            @if (product()!.description) {
              <div style="line-height:1.8; white-space:pre-wrap">{{ product()!.description }}</div>
            } @else if (product()!.shortDescription) {
              <p>{{ product()!.shortDescription }}</p>
              <p style="color:var(--velisse-muted)">
                <em>Ce produit fait partie de la sélection {{ product()!.brandName || 'VELISSE' }}.
                Pour plus d'informations, contactez-nous.</em>
              </p>
            } @else {
              <p style="color:var(--velisse-muted)">
                <em>Description détaillée à venir. Pour toute question sur ce produit, n'hésitez pas à
                <a routerLink="/legal/contact" style="color:var(--velisse-rose-gold)">nous contacter</a>.</em>
              </p>
            }
          </div>
        }

        @if (activeTab() === 'specs') {
          <div class="table-responsive">
            <table class="table">
              <tbody>
                <tr><th style="color:var(--velisse-muted); width:35%">Référence</th><td><code>{{ product()!.sku }}</code></td></tr>
                <tr><th style="color:var(--velisse-muted)">Catégorie</th><td>{{ product()!.categoryName }}</td></tr>
                @if (product()!.brandName) {
                  <tr><th style="color:var(--velisse-muted)">Marque</th><td>{{ product()!.brandName }}</td></tr>
                }
                @if (product()!.weightKg) {
                  <tr><th style="color:var(--velisse-muted)">Poids</th><td>{{ product()!.weightKg }} kg</td></tr>
                }
                @if (product()!.barcode) {
                  <tr><th style="color:var(--velisse-muted)">Code-barres</th><td><code>{{ product()!.barcode }}</code></td></tr>
                }
                @for (a of attributesList(); track a.key) {
                  <tr><th style="color:var(--velisse-muted); text-transform:capitalize">{{ a.key }}</th><td>{{ a.value }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (activeTab() === 'shipping') {
          <div>
            <h6 class="info-h"><i class="bi bi-truck me-1"></i> Livraison</h6>
            <p>Livraison rapide partout au Maroc en 2 à 5 jours ouvrés. Livraison express disponible.
            International : virement bancaire préalable, expédition sous 5 à 14 jours.</p>

            <h6 class="info-h mt-4"><i class="bi bi-cash-coin me-1"></i> Paiement</h6>
            <p>Au Maroc : paiement à la livraison (cash) — pas de prépaiement.
            À l'international : virement bancaire avant expédition (RIB envoyé par email).</p>

            <h6 class="info-h mt-4"><i class="bi bi-arrow-counterclockwise me-1"></i> Retour &amp; remboursement</h6>
            <p>Vous disposez de 7 jours après réception pour retourner votre produit s'il ne vous convient pas
            (produit non ouvert, dans son emballage d'origine).</p>
          </div>
        }
      </div>
    </section>

    <!-- VOUS AIMEREZ AUSSI -->
    @if (relatedProducts().length > 0) {
      <section class="mt-5">
        <div class="section-title">
          <div class="section-sub">À découvrir</div>
          <h2>Vous aimerez aussi</h2>
          <div class="section-line"><span class="line"></span><i class="bi bi-flower2"></i><span class="line"></span></div>
        </div>
        <div class="row g-3 g-md-4">
          @for (p of relatedProducts(); track p.id) {
            <div class="col-6 col-md-3">
              <article class="product-card position-relative">
                <div class="product-img-wrap">
                  <a [routerLink]="['/product', p.slug]">
                    <img [src]="p.primaryImageUrl || 'https://picsum.photos/seed/' + p.slug + '/400/400'" [alt]="p.name">
                  </a>
                  <div class="product-badges">
                    @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                      <span class="badge bg-sale">-{{ discountFor(p) }}%</span>
                    }
                  </div>
                  <div class="product-quick">
                    <button class="btn btn-light btn-sm w-100 btn-uppercase"
                            [disabled]="!p.isInStock"
                            (click)="addRelatedToCart(p)">
                      <i class="bi bi-bag-plus me-1"></i> Ajouter
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
      </section>
    }

    <!-- AVIS CLIENTS -->
    <section class="mt-5" id="reviews">
      <div class="section-title">
        <div class="section-sub">Témoignages</div>
        <h2>Avis Clients</h2>
        <div class="section-line"><span class="line"></span><i class="bi bi-flower2"></i><span class="line"></span></div>
      </div>

      <div class="row g-4">
        <div class="col-md-5">
          <div class="reviews-summary p-4 text-center">
            <div class="display-4" style="font-family:'Playfair Display'; color:var(--velisse-rose-gold); font-weight:600">
              0.0
            </div>
            <div class="star-display mb-2" style="font-size:1.2rem">
              <i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i>
            </div>
            <p class="small mb-3" style="color:var(--velisse-muted)">Aucun avis pour le moment</p>
            <button class="btn btn-outline-dark btn-uppercase" (click)="toast.info('Fonctionnalité avis clients à venir prochainement')">
              <i class="bi bi-pencil me-1"></i> Écrire un avis
            </button>
          </div>
        </div>
        <div class="col-md-7">
          <div class="reviews-list p-4">
            <h6 class="info-h mb-3">Répartition des notes</h6>
            @for (star of [5,4,3,2,1]; track star) {
              <div class="d-flex align-items-center gap-2 mb-2">
                <span style="min-width:60px; font-size:.85rem">{{ star }} étoile{{ star > 1 ? 's' : '' }}</span>
                <div class="progress flex-grow-1" style="height:8px; background:var(--velisse-rose-bg)">
                  <div class="progress-bar" style="background:var(--velisse-rose-gold); width:0%"></div>
                </div>
                <span style="min-width:30px; font-size:.85rem; color:var(--velisse-muted); text-align:right">0</span>
              </div>
            }
            <p class="small mt-3 mb-0" style="color:var(--velisse-muted)">
              <i class="bi bi-info-circle me-1"></i>
              Les avis clients seront affichés ici dès qu'ils seront publiés.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- FLOATING BOTTOM BAR -->
  @if (showStickyBar() && product()!.isInStock) {
    <div class="sticky-buy-bar">
      <div class="container d-flex align-items-center gap-2 gap-md-3 py-2">
        @if (selectedImage()) {
          <img [src]="selectedImage()!.url" [alt]="product()!.name" class="d-none d-md-block"
               style="width:50px; height:50px; object-fit:cover">
        }
        <div class="flex-grow-1" style="min-width:0">
          <div class="text-truncate fw-semibold" style="font-size:.9rem">{{ product()!.name }}</div>
          <div class="small" style="color:var(--velisse-rose-gold); font-weight:600">
            {{ product()!.basePrice | money:product()!.currency }}
          </div>
        </div>
        <div class="input-group d-none d-md-flex" style="max-width:120px">
          <button class="btn btn-sm btn-outline-dark" (click)="dec()">−</button>
          <input type="number" class="form-control form-control-sm text-center" [(ngModel)]="quantity" min="1">
          <button class="btn btn-sm btn-outline-dark" (click)="inc()">+</button>
        </div>
        <button class="btn btn-primary btn-uppercase" (click)="addToCart()">
          <i class="bi bi-bag-plus me-1"></i>
          <span class="d-none d-md-inline">Ajouter au panier</span>
        </button>
      </div>
    </div>
  }
}
  `,
  styles: [`
    .product-gallery { background: var(--velisse-rose-bg); overflow: hidden; }
    .main-image { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }

    .thumbnail-strip { overflow-x: auto; padding-bottom: 4px; }
    .thumbnail {
      width: 64px; height: 64px; object-fit: cover; cursor: pointer;
      border: 1px solid var(--velisse-border); flex-shrink: 0; transition: border-color .2s;
    }
    .thumbnail.active { border: 2px solid var(--velisse-rose-gold); }
    @media (min-width: 768px) {
      .thumbnail { width: 78px; height: 78px; }
    }

    .brand-label {
      font-size: .75rem; letter-spacing: .18em; text-transform: uppercase;
      color: var(--velisse-rose-gold); font-weight: 500;
    }
    .product-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 500;
      margin-bottom: .5rem; line-height: 1.2;
    }
    .short-desc { color: var(--velisse-muted); font-size: 1rem; line-height: 1.6; }

    .star-display { color: var(--velisse-rose-gold); font-size: .9rem; }

    .price-main {
      font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 600; color: var(--velisse-rose-gold);
    }
    .price-old { text-decoration: line-through; color: var(--velisse-muted); font-size: 1rem; }

    .usp-tile {
      background: var(--velisse-rose-bg); padding: .75rem;
      display: flex; gap: .6rem; align-items: center;
      font-size: .8rem; height: 100%;
    }
    .usp-tile i { color: var(--velisse-rose-gold); font-size: 1.2rem; flex-shrink: 0; }
    .usp-tile small { color: var(--velisse-muted); }

    .btn-link-soft {
      background: transparent; border: none; color: var(--velisse-text);
      padding: 0; text-decoration: none; transition: color .15s;
      font-size: .85rem;
    }
    .btn-link-soft:hover { color: var(--velisse-rose-gold); }

    .product-tabs .nav-tabs { border-bottom: 1px solid var(--velisse-border); }
    .product-tabs .nav-link {
      border: none; border-bottom: 2px solid transparent;
      color: var(--velisse-muted); font-weight: 500;
      padding: .85rem 1.2rem; background: transparent;
      letter-spacing: .04em; white-space: nowrap; font-size: .9rem;
    }
    .product-tabs .nav-link:hover { color: var(--velisse-text); }
    .product-tabs .nav-link.active {
      color: var(--velisse-rose-gold); border-bottom-color: var(--velisse-rose-gold);
      background: transparent;
    }
    .product-tabs .tab-content {
      background: #fff; border: 1px solid var(--velisse-border);
      border-top: none; line-height: 1.7;
    }
    .product-tabs table th { font-weight: 500; vertical-align: top; }

    .info-h {
      font-family: 'Poppins'; text-transform: uppercase; letter-spacing: .12em;
      font-size: .82rem; color: var(--velisse-rose-gold); font-weight: 500;
    }

    .section-line { display: inline-flex; align-items: center; gap: 1rem; color: var(--velisse-rose-gold); }
    .section-line .line { display: inline-block; width: 40px; height: 1px; background: var(--velisse-rose-gold); }
    .section-line i { font-size: .8rem; }

    .reviews-summary, .reviews-list {
      background: var(--velisse-rose-bg);
      border: 1px solid var(--velisse-border);
      height: 100%;
    }

    .sticky-buy-bar {
      position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
      border-top: 1px solid var(--velisse-border);
      box-shadow: 0 -4px 16px rgba(61, 40, 23, .08);
      z-index: 1030;
      animation: slideUp .25s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
  `]
})
export class ProductDetailComponent {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  readonly toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product = signal<ProductDetail | null>(null);
  selectedImage = signal<ProductImage | null>(null);
  loading = signal(true);
  relatedProducts = signal<ProductListItem[]>([]);
  quantity = 1;
  activeTab = signal<'desc' | 'specs' | 'shipping'>('desc');
  showStickyBar = signal(false);

  constructor() {
    this.route.paramMap.subscribe(p => {
      const slug = p.get('slug');
      if (!slug) { this.router.navigate(['/catalog']); return; }
      this.loading.set(true);
      this.activeTab.set('desc');
      this.catalog.getProduct(slug).subscribe({
        next: prod => {
          this.product.set(prod);
          this.selectedImage.set(prod.images.find(i => i.isPrimary) || prod.images[0] || null);
          this.quantity = 1;
          this.loading.set(false);
          this.loadRelated(prod);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: () => { this.product.set(null); this.loading.set(false); }
      });
    });
  }

  private loadRelated(p: ProductDetail) {
    this.catalog.getProducts({ categorySlug: p.categorySlug, pageSize: 5 }).subscribe({
      next: r => this.relatedProducts.set(r.items.filter(x => x.id !== p.id).slice(0, 4))
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showStickyBar.set(window.scrollY > 600);
  }

  discount = computed(() => {
    const p = this.product();
    if (!p?.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round(100 * (p.compareAtPrice - p.basePrice) / p.compareAtPrice);
  });

  discountFor(p: ProductListItem): number {
    if (!p.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round(100 * (p.compareAtPrice - p.basePrice) / p.compareAtPrice);
  }

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

  addRelatedToCart(p: ProductListItem): void {
    this.cart.add(p);
    this.toast.success(`${p.name} ajouté au panier`);
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/checkout']);
  }

  scrollToReviews(e: Event): void {
    e.preventDefault();
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
  }

  share(): void {
    const url = window.location.href;
    const title = this.product()?.name ?? 'Velisse';
    if ((navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> }).share) {
      (navigator as Navigator & { share: (data: { title?: string; url?: string }) => Promise<void> }).share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => this.toast.success('Lien copié dans le presse-papier'));
    }
  }
}
