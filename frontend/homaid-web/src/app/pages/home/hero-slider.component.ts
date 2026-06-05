import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { ProductListItem } from '../../core/models/catalog.models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [CommonModule, RouterLink, NgbCarouselModule, MoneyPipe],
  template: `
@if (slides().length > 0) {
  <section class="hero-slider">
    <ngb-carousel
      [showNavigationArrows]="slides().length > 1"
      [showNavigationIndicators]="slides().length > 1"
      [interval]="6000"
      [pauseOnHover]="true"
      [wrap]="true">
      @for (p of slides(); track p.id; let i = $index) {
        <ng-template ngbSlide>
          <div class="slide" [style.background-image]="bgFor(i)">
            <div class="slide-overlay"></div>
            <div class="container slide-content">
              <div class="row align-items-center g-4 g-md-5">
                <div class="col-md-6 order-md-1 order-2">
                  <div class="section-sub mb-2 slide-tag">
                    @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                      <span class="slide-badge">Promo · -{{ discount(p) }}%</span>
                    } @else {
                      <span>Coup de cœur</span>
                    }
                  </div>
                  @if (p.brandName) {
                    <div class="slide-brand">{{ p.brandName }}</div>
                  }
                  <h1 class="slide-title">{{ p.name }}</h1>
                  @if (p.shortDescription) {
                    <p class="slide-desc">{{ p.shortDescription }}</p>
                  }
                  <div class="slide-price">
                    <span class="price-main">{{ p.basePrice | money:p.currency }}</span>
                    @if (p.compareAtPrice && p.compareAtPrice > p.basePrice) {
                      <span class="price-old">{{ p.compareAtPrice | money:p.currency }}</span>
                    }
                  </div>
                  <div class="d-flex gap-2 flex-wrap">
                    <a [routerLink]="['/product', p.slug]" class="btn btn-dark btn-lg btn-uppercase">
                      Voir le produit <i class="bi bi-arrow-right ms-2"></i>
                    </a>
                    <a routerLink="/catalog" class="btn btn-outline-dark btn-lg btn-uppercase">
                      Catalogue
                    </a>
                  </div>
                </div>
                <div class="col-md-6 order-md-2 order-1 text-center">
                  <div class="slide-img-wrap">
                    <img [src]="p.primaryImageUrl || 'https://picsum.photos/seed/' + p.slug + '/700/700'"
                         [alt]="p.name" class="slide-img">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      }
    </ngb-carousel>
  </section>
}
  `,
  styles: [`
    :host { display: block; }

    .hero-slider :global(.carousel-indicators) {
      bottom: 1rem;
    }
    .hero-slider :global(.carousel-indicators [data-bs-target]) {
      width: 12px; height: 12px; border-radius: 50%; opacity: .5;
      background-color: var(--velisse-rose-gold);
      border: 2px solid #fff;
    }
    .hero-slider :global(.carousel-indicators .active) { opacity: 1; }

    .hero-slider :global(.carousel-control-prev),
    .hero-slider :global(.carousel-control-next) {
      width: 5%;
    }
    .hero-slider :global(.carousel-control-prev-icon),
    .hero-slider :global(.carousel-control-next-icon) {
      background-color: rgba(61, 40, 23, .65);
      border-radius: 50%; padding: 1.5rem;
      background-size: 50%;
    }

    .slide {
      min-height: 540px;
      display: flex; align-items: center;
      background-size: cover; background-position: center;
      background-color: var(--velisse-rose-light);
      position: relative;
    }
    .slide-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(115deg, var(--velisse-rose-light) 0%, var(--velisse-cream) 50%, rgba(251,233,229,.4) 100%);
    }
    .slide-content {
      position: relative; z-index: 2;
      padding: 3rem 1rem;
    }

    .slide-tag {
      letter-spacing: .3em; font-size: .75rem;
      text-transform: uppercase; color: var(--velisse-rose-gold);
      font-weight: 500;
    }
    .slide-badge {
      background: var(--velisse-sale); color: #fff;
      padding: .35rem .75rem; border-radius: 999px;
      letter-spacing: .08em; font-weight: 500;
    }

    .slide-brand {
      font-size: .8rem; letter-spacing: .18em;
      text-transform: uppercase; color: var(--velisse-rose-gold);
      font-weight: 500; margin-bottom: .25rem; margin-top: .75rem;
    }
    .slide-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.8rem, 4vw, 3.25rem);
      font-weight: 600; line-height: 1.1;
      color: var(--velisse-brown);
      margin-bottom: 1rem;
    }
    .slide-desc {
      color: var(--velisse-muted);
      font-size: 1.05rem; line-height: 1.5;
      margin-bottom: 1.25rem;
      max-width: 480px;
    }
    .slide-price {
      display: flex; gap: .85rem; align-items: baseline;
      margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .slide-price .price-main {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 600; color: var(--velisse-rose-gold);
    }
    .slide-price .price-old {
      text-decoration: line-through; color: var(--velisse-muted);
      font-size: 1.05rem;
    }

    .slide-img-wrap {
      position: relative;
      max-width: 460px; margin: 0 auto;
    }
    .slide-img-wrap::before {
      content: '';
      position: absolute; inset: -10% -10% -10% -10%;
      background: radial-gradient(circle, rgba(184,133,119,.2) 0%, transparent 70%);
      border-radius: 50%;
      z-index: -1;
    }
    .slide-img {
      width: 100%; aspect-ratio: 1;
      object-fit: cover; border-radius: 8px;
      box-shadow: 0 18px 40px rgba(61, 40, 23, .12);
    }

    @media (max-width: 767.98px) {
      .slide { min-height: auto; }
      .slide-content { padding: 2rem .5rem 3.5rem; }
      .slide-img-wrap { max-width: 280px; }
    }
  `]
})
export class HeroSliderComponent {
  @Input() set products(value: ProductListItem[]) {
    this.slides.set(value.slice(0, 5));
  }

  slides = signal<ProductListItem[]>([]);

  bgFor(index: number): string {
    // Léger dégradé alterné pour variation visuelle entre slides
    const palettes = [
      'linear-gradient(135deg, #FBE9E5 0%, #FAF6F2 100%)',
      'linear-gradient(135deg, #FAF6F2 0%, #FBE9E5 100%)',
      'linear-gradient(135deg, #F5D6CE 0%, #FBE9E5 100%)',
      'linear-gradient(135deg, #FBE9E5 0%, #F5D6CE 100%)',
      'linear-gradient(135deg, #FDF7F4 0%, #FBE9E5 100%)'
    ];
    return palettes[index % palettes.length];
  }

  discount(p: ProductListItem): number {
    if (!p.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round(100 * (p.compareAtPrice - p.basePrice) / p.compareAtPrice);
  }
}
