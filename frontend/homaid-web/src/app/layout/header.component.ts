import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryListItem } from '../core/models/catalog.models';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { CatalogService } from '../core/services/catalog.service';
import { LanguageService, SupportedLanguage } from '../core/services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
<!-- Top promo bar -->
<div class="top-promo-bar">
  <div class="container d-flex justify-content-between align-items-center" style="font-size:.75rem">
    <div class="d-none d-md-flex gap-3">
      <a href="#" style="color:inherit"><i class="bi bi-facebook"></i></a>
      <a href="#" style="color:inherit"><i class="bi bi-instagram"></i></a>
      <a href="#" style="color:inherit"><i class="bi bi-tiktok"></i></a>
      <a href="#" style="color:inherit"><i class="bi bi-whatsapp"></i></a>
    </div>
    <div class="text-center flex-grow-1">
      <i class="bi bi-flower2 me-1"></i>
      Livraison rapide partout au Maroc &nbsp;·&nbsp;
      <i class="bi bi-cash-coin me-1"></i>
      Paiement à la livraison
    </div>
    <div class="d-none d-md-block" style="min-width:80px; text-align:right">
      <a routerLink="/legal/contact" style="color:inherit">Contact</a>
    </div>
  </div>
</div>

<header class="main-header">
  <!-- Row 1 : Search / Brand / Icons -->
  <div class="container py-3 py-md-4">
    <div class="d-flex align-items-center justify-content-between">
      <!-- Search (gauche) -->
      <div class="d-flex" style="min-width:200px">
        @if (searchOpen()) {
          <form (ngSubmit)="doSearch()" class="d-flex w-100">
            <input #searchInput type="search" class="form-control form-control-sm" placeholder="Rechercher un produit, une marque..."
                   [(ngModel)]="searchQuery" name="q" autofocus>
            <button class="btn btn-sm btn-dark ms-1" type="submit"><i class="bi bi-search"></i></button>
            <button type="button" class="btn btn-sm btn-link" (click)="searchOpen.set(false)"><i class="bi bi-x-lg"></i></button>
          </form>
        } @else {
          <button class="header-icon" (click)="toggleSearch()" aria-label="Rechercher">
            <i class="bi bi-search"></i>
            <span class="d-none d-lg-inline ms-1" style="font-size:.78rem; letter-spacing:.14em; text-transform:uppercase">Rechercher</span>
          </button>
        }
      </div>

      <!-- Brand (centré) -->
      <a class="brand text-center d-block" routerLink="/" style="line-height:1;">
        <div>VELISSE</div>
        <div class="brand-tagline d-none d-md-block">Parapharmacie &amp; Korean Skincare</div>
      </a>

      <!-- Icônes (droite) -->
      <div class="d-flex align-items-center gap-2 gap-md-3" style="min-width:200px; justify-content:flex-end">
        <!-- Language -->
        <div class="dropdown d-none d-md-block">
          <button class="header-icon" type="button" (click)="toggleLang()" aria-label="Langue">
            <span style="font-size:.78rem; letter-spacing:.12em; font-weight:500">{{ lang.current().toUpperCase() }}</span>
            <i class="bi bi-chevron-down ms-1" style="font-size:.7rem"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" [class.show]="langOpen()" style="position:absolute">
            <li><button class="dropdown-item" (click)="setLang('fr')">🇫🇷 Français</button></li>
            <li><button class="dropdown-item" (click)="setLang('ar')">🇸🇦 العربية</button></li>
            <li><button class="dropdown-item" (click)="setLang('en')">🇬🇧 English</button></li>
          </ul>
        </div>

        <!-- User -->
        @if (auth.isAuthenticated()) {
          <div class="dropdown">
            <button class="header-icon" type="button" (click)="toggleUser()" aria-label="Compte">
              <i class="bi bi-person"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" [class.show]="userOpen()" style="position:absolute; min-width:220px">
              <li class="px-3 py-2 border-bottom">
                <small style="color:var(--velisse-muted)">Bonjour,</small>
                <div class="fw-semibold">{{ shortName() }}</div>
                @if (auth.isAdmin()) {
                  <span class="badge mt-1" style="background:var(--velisse-rose-gold); color:#fff; font-size:.65rem; letter-spacing:.1em">ADMIN</span>
                }
              </li>
              @if (auth.isAdmin()) {
                <li><a class="dropdown-item" routerLink="/admin"><i class="bi bi-speedometer2 me-2"></i>Espace admin</a></li>
                <li><a class="dropdown-item" routerLink="/admin/products"><i class="bi bi-box-seam me-2"></i>Gérer produits</a></li>
                <li><a class="dropdown-item" routerLink="/admin/categories"><i class="bi bi-tags me-2"></i>Gérer catégories</a></li>
                <li><a class="dropdown-item" routerLink="/admin/orders"><i class="bi bi-receipt me-2"></i>Commandes</a></li>
                <li><hr class="dropdown-divider"></li>
              }
              @if (auth.isCustomer()) {
                <li><a class="dropdown-item" routerLink="/account"><i class="bi bi-person me-2"></i>Mon profil</a></li>
                <li><a class="dropdown-item" routerLink="/account/orders"><i class="bi bi-bag me-2"></i>Mes commandes</a></li>
                <li><a class="dropdown-item" routerLink="/account/addresses"><i class="bi bi-geo-alt me-2"></i>Mes adresses</a></li>
                <li><hr class="dropdown-divider"></li>
              }
              <li><button class="dropdown-item text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i>Déconnexion</button></li>
            </ul>
          </div>
        } @else {
          <a class="header-icon" routerLink="/login" aria-label="Se connecter">
            <i class="bi bi-person"></i>
          </a>
        }

        <!-- Heart (favoris - placeholder) -->
        <a class="header-icon d-none d-md-inline-flex" routerLink="/account" aria-label="Favoris">
          <i class="bi bi-heart"></i>
        </a>

        <!-- Cart -->
        <a class="header-icon" routerLink="/cart" aria-label="Panier">
          <i class="bi bi-bag"></i>
          @if (cart.itemCount() > 0) {
            <span class="header-badge">{{ cart.itemCount() }}</span>
          }
        </a>

        <!-- Mobile menu toggle -->
        <button class="header-icon d-lg-none" (click)="toggleNav()" aria-label="Menu">
          <i class="bi" [class.bi-list]="!navOpen()" [class.bi-x]="navOpen()"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Row 2 : Main nav (style zwine) -->
  <nav class="main-nav border-top" [class.mobile-open]="navOpen()">
    <div class="container">
      <ul class="nav justify-content-center flex-column flex-lg-row py-2">
        <li class="nav-item">
          <a class="nav-link" [routerLink]="['/catalog']" [queryParams]="{sort:'newest'}" (click)="navOpen.set(false)">
            Nouveautés
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link nav-link-promo" [routerLink]="['/catalog']" [queryParams]="{featured:'true'}" (click)="navOpen.set(false)">
            Promos
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" routerLink="/brands" routerLinkActive="active" (click)="navOpen.set(false)">
            Marques
          </a>
        </li>
        @for (c of categories(); track c.id) {
          <li class="nav-item">
            <a class="nav-link" [routerLink]="['/catalog']" [queryParams]="{category:c.slug}" (click)="navOpen.set(false)">
              {{ c.name }}
            </a>
          </li>
        }
        <li class="nav-item">
          <a class="nav-link" routerLink="/catalog" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="navOpen.set(false)">
            Tout le catalogue
          </a>
        </li>
      </ul>
    </div>
  </nav>
</header>
  `,
  styles: [`
    .dropdown-menu.show { display: block; margin-top: .25rem; }

    .main-nav .nav-link {
      font-size: .82rem;
      text-transform: uppercase;
      letter-spacing: .12em;
      font-weight: 500;
      color: var(--velisse-text);
      padding: .5rem 1rem;
      border-bottom: 2px solid transparent;
      transition: all .15s;
    }
    .main-nav .nav-link:hover,
    .main-nav .nav-link.active {
      color: var(--velisse-rose-gold);
      border-bottom-color: var(--velisse-rose-gold);
    }
    .main-nav .nav-link-promo {
      color: var(--velisse-sale);
      font-weight: 600;
    }
    .main-nav .nav-link-promo:hover {
      color: var(--velisse-sale);
      border-bottom-color: var(--velisse-sale);
    }

    @media (max-width: 991.98px) {
      .brand { font-size: 1.5rem !important; }
      .main-nav { display: none; }
      .main-nav.mobile-open {
        display: block;
        background: #fff;
        box-shadow: 0 8px 20px rgba(61, 40, 23, .06);
      }
      .main-nav .nav-link {
        text-align: center;
        padding: .8rem 1rem;
      }
    }
  `]
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly lang = inject(LanguageService);
  private catalog = inject(CatalogService);
  private router = inject(Router);

  navOpen = signal(false);
  langOpen = signal(false);
  userOpen = signal(false);
  searchOpen = signal(false);
  searchQuery = '';

  categories = signal<CategoryListItem[]>([]);

  shortName = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    return u.fullName.split(' ')[0] || u.email;
  });

  constructor() {
    this.catalog.getCategoriesFlat().subscribe(cs => {
      // Categories de premier niveau (sans parent) — limité à 7 pour ne pas saturer
      this.categories.set(cs.filter(c => !c.parentId).slice(0, 7));
    });
  }

  toggleNav() { this.navOpen.update(v => !v); this.langOpen.set(false); this.userOpen.set(false); }
  toggleLang() { this.langOpen.update(v => !v); this.userOpen.set(false); }
  toggleUser() { this.userOpen.update(v => !v); this.langOpen.set(false); }
  toggleSearch() { this.searchOpen.set(true); }

  doSearch() {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/catalog'], { queryParams: { search: this.searchQuery.trim() } });
    this.searchOpen.set(false);
    this.searchQuery = '';
  }

  setLang(l: SupportedLanguage) {
    this.lang.set(l);
    this.langOpen.set(false);
    location.reload();
  }

  logout() {
    this.auth.logout().subscribe({
      complete: () => { this.userOpen.set(false); location.assign('/'); },
      error: () => { this.userOpen.set(false); location.assign('/'); }
    });
  }
}
