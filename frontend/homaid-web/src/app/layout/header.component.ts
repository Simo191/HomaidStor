import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  <i class="bi bi-flower2 me-1"></i>
  Livraison rapide partout au Maroc &nbsp;·&nbsp;
  <i class="bi bi-cash-coin me-1"></i>
  Paiement à la livraison &nbsp;·&nbsp;
  <i class="bi bi-stars me-1"></i>
  100% authentique
</div>

<header class="main-header">
  <div class="container py-3">
    <!-- Ligne 1 : brand centré + icônes -->
    <div class="d-flex align-items-center justify-content-between">
      <!-- Recherche (gauche) -->
      <div class="d-none d-md-block" style="min-width:200px">
        @if (searchOpen()) {
          <form (ngSubmit)="doSearch()" class="d-flex">
            <input #searchInput type="search" class="form-control form-control-sm" placeholder="Rechercher..."
                   [(ngModel)]="searchQuery" name="q" autofocus>
            <button class="btn btn-sm btn-dark ms-1" type="submit"><i class="bi bi-search"></i></button>
          </form>
        } @else {
          <button class="header-icon" (click)="toggleSearch()" aria-label="Rechercher">
            <i class="bi bi-search"></i>
            <span class="ms-1 d-none d-lg-inline" style="font-size:.85rem; letter-spacing:.1em">RECHERCHER</span>
          </button>
        }
      </div>

      <!-- Brand (centré) -->
      <a class="brand text-center flex-grow-1 flex-md-grow-0 d-block" routerLink="/" style="line-height:1;">
        <div>VELISSE</div>
        <div class="brand-tagline d-none d-md-block">Parapharmacie &amp; Korean Skincare</div>
      </a>

      <!-- Icônes (droite) -->
      <div class="d-flex align-items-center gap-2 gap-md-3" style="min-width:200px; justify-content:flex-end">
        <!-- Language -->
        <div class="dropdown">
          <button class="header-icon" type="button" (click)="toggleLang()" aria-label="Langue">
            <span style="font-size:.8rem; letter-spacing:.1em; font-weight:500">{{ lang.current().toUpperCase() }}</span>
            <i class="bi bi-chevron-down" style="font-size:.7rem"></i>
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
            <ul class="dropdown-menu dropdown-menu-end" [class.show]="userOpen()" style="position:absolute">
              <li class="px-3 pb-2 border-bottom">
                <small class="text-muted">Bonjour,</small>
                <div class="fw-semibold">{{ shortName() }}</div>
              </li>
              <li><a class="dropdown-item" routerLink="/account"><i class="bi bi-person me-2"></i>Mon compte</a></li>
              <li><a class="dropdown-item" routerLink="/account/orders"><i class="bi bi-bag me-2"></i>Mes commandes</a></li>
              <li><a class="dropdown-item" routerLink="/account/addresses"><i class="bi bi-geo-alt me-2"></i>Mes adresses</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i>Déconnexion</button></li>
            </ul>
          </div>
        } @else {
          <a class="header-icon" routerLink="/login" aria-label="Se connecter">
            <i class="bi bi-person"></i>
          </a>
        }

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

  <!-- Ligne 2 : Navigation principale -->
  <nav class="border-top" [class.d-none]="!navOpen()" [class.d-lg-block]="true">
    <div class="container">
      <ul class="nav justify-content-center flex-column flex-lg-row py-2">
        <li class="nav-item"><a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="navOpen.set(false)">Accueil</a></li>
        <li class="nav-item"><a class="nav-link" routerLink="/catalog" routerLinkActive="active" (click)="navOpen.set(false)">Catalogue</a></li>
        @for (c of topCategories(); track c.id) {
          <li class="nav-item">
            <a class="nav-link" [routerLink]="['/catalog']" [queryParams]="{ category: c.slug }" (click)="navOpen.set(false)">
              {{ c.name }}
            </a>
          </li>
        }
        <li class="nav-item"><a class="nav-link" [routerLink]="['/catalog']" [queryParams]="{ featured: 'true' }" (click)="navOpen.set(false)"><span class="text-danger">Promos</span></a></li>
      </ul>
    </div>
  </nav>
</header>
  `,
  styles: [`
    .dropdown-menu.show { display: block; margin-top: .25rem; }
    @media (max-width: 991.98px) {
      .brand { font-size: 1.4rem; }
      nav .nav { background: #fff; padding: 1rem 0 !important; box-shadow: 0 8px 20px rgba(0,0,0,.06); }
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

  topCategories = signal<Array<{ id: string; slug: string; name: string }>>([]);

  shortName = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    return u.fullName.split(' ')[0] || u.email;
  });

  constructor() {
    this.catalog.getCategoryTree().subscribe(cs => this.topCategories.set(cs.slice(0, 4)));
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
