import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Brand } from '../../core/models/catalog.models';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="container my-4 my-md-5">
  <!-- Page title -->
  <div class="text-center mb-5">
    <div class="section-sub" style="color:var(--velisse-rose-gold); letter-spacing:.35em; font-size:.78rem; text-transform:uppercase; font-weight:500">
      Découvrir
    </div>
    <h1 style="font-size:clamp(2rem, 3vw, 2.75rem); font-weight:500; margin-top:.5rem">Nos Marques</h1>
    <div class="d-inline-flex align-items-center gap-2 mt-2" style="color:var(--velisse-rose-gold)">
      <span style="width:40px; height:1px; background:var(--velisse-rose-gold); display:inline-block"></span>
      <i class="bi bi-flower2"></i>
      <span style="width:40px; height:1px; background:var(--velisse-rose-gold); display:inline-block"></span>
    </div>
    <p class="mt-3" style="color:var(--velisse-muted)">Une sélection exclusive de marques authentiques.</p>
  </div>

  @if (loading()) {
    <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
  } @else if (brands().length === 0) {
    <div class="text-center py-5" style="color:var(--velisse-muted)">
      <i class="bi bi-bookmark-x display-3"></i>
      <p class="mt-3">Aucune marque pour l'instant.</p>
    </div>
  } @else {
    <div class="row g-4">
      @for (b of brands(); track b.id) {
        <div class="col-6 col-md-4 col-lg-3">
          <a [routerLink]="['/catalog']" [queryParams]="{ brand: b.slug }"
             class="brand-tile d-block text-decoration-none">
            <div class="brand-logo-wrap">
              @if (b.logoUrl) {
                <img [src]="b.logoUrl" [alt]="b.name" class="brand-logo">
              } @else {
                <span class="brand-text-logo">{{ b.name }}</span>
              }
            </div>
            <div class="brand-info">
              <div class="brand-name">{{ b.name }}</div>
              <small style="color:var(--velisse-muted)">{{ b.productCount }} produits</small>
            </div>
          </a>
        </div>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .brand-tile {
      background: #fff;
      border: 1px solid var(--velisse-border);
      transition: all .2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .brand-tile:hover {
      border-color: var(--velisse-rose-gold);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(61, 40, 23, .06);
    }
    .brand-logo-wrap {
      aspect-ratio: 1.5;
      background: var(--velisse-rose-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .brand-logo {
      max-width: 80%;
      max-height: 80%;
      object-fit: contain;
    }
    .brand-text-logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--velisse-brown);
      letter-spacing: .04em;
    }
    .brand-info {
      padding: .85rem 1rem;
      text-align: center;
    }
    .brand-name {
      font-weight: 500;
      color: var(--velisse-text);
      margin-bottom: .15rem;
    }
  `]
})
export class BrandsPageComponent {
  private catalog = inject(CatalogService);

  brands = signal<Brand[]>([]);
  loading = signal(true);

  constructor() {
    this.catalog.getBrands().subscribe({
      next: bs => { this.brands.set(bs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
