import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { LanguageService, SupportedLanguage } from '../core/services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
  <div class="container">
    <a class="navbar-brand fw-bold" routerLink="/">
      <i class="bi bi-bag-heart-fill text-primary me-1"></i>
      Homaid <span class="text-primary">Store</span>
    </a>

    <button class="navbar-toggler" type="button" (click)="toggleNav()" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" [class.show]="navOpen">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item"><a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Accueil</a></li>
        <li class="nav-item"><a class="nav-link" routerLink="/catalog" routerLinkActive="active">Catalogue</a></li>
      </ul>

      <div class="d-flex align-items-center gap-2">
        <!-- Language switcher -->
        <div class="dropdown">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" (click)="toggleLang()" aria-expanded="false">
            <i class="bi bi-globe"></i> {{ lang.current().toUpperCase() }}
          </button>
          <ul class="dropdown-menu dropdown-menu-end" [class.show]="langOpen" style="position:absolute">
            <li><button class="dropdown-item" (click)="setLang('fr')">Français</button></li>
            <li><button class="dropdown-item" (click)="setLang('ar')">العربية</button></li>
            <li><button class="dropdown-item" (click)="setLang('en')">English</button></li>
          </ul>
        </div>

        <!-- Cart -->
        <a class="btn btn-sm btn-outline-primary position-relative" routerLink="/cart" aria-label="Panier">
          <i class="bi bi-cart3"></i>
          @if (cart.itemCount() > 0) {
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {{ cart.itemCount() }}
            </span>
          }
        </a>

        <!-- User menu -->
        @if (auth.isAuthenticated()) {
          <div class="dropdown">
            <button class="btn btn-sm btn-primary dropdown-toggle" type="button" (click)="toggleUser()" aria-expanded="false">
              <i class="bi bi-person-circle"></i>
              <span class="d-none d-md-inline ms-1">{{ shortName() }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" [class.show]="userOpen" style="position:absolute">
              <li><a class="dropdown-item" routerLink="/account">Mon compte</a></li>
              <li><a class="dropdown-item" routerLink="/account/orders">Mes commandes</a></li>
              <li><a class="dropdown-item" routerLink="/account/addresses">Mes adresses</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item" (click)="logout()">Déconnexion</button></li>
            </ul>
          </div>
        } @else {
          <a class="btn btn-sm btn-outline-primary" routerLink="/login">
            <i class="bi bi-box-arrow-in-right"></i>
            <span class="d-none d-md-inline ms-1">Connexion</span>
          </a>
        }
      </div>
    </div>
  </div>
</nav>
  `,
  styles: [`
    .navbar-brand { font-size: 1.4rem; }
    .nav-link.active { color: var(--homaid-primary) !important; font-weight: 600; }
    .dropdown-menu.show { display: block; }
  `]
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly lang = inject(LanguageService);

  navOpen = false;
  langOpen = false;
  userOpen = false;

  shortName = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    const parts = u.fullName.split(' ');
    return parts[0] || u.email;
  });

  toggleNav() { this.navOpen = !this.navOpen; this.langOpen = false; this.userOpen = false; }
  toggleLang() { this.langOpen = !this.langOpen; this.userOpen = false; }
  toggleUser() { this.userOpen = !this.userOpen; this.langOpen = false; }

  setLang(l: SupportedLanguage) {
    this.lang.set(l);
    this.langOpen = false;
    location.reload();
  }

  logout() {
    this.auth.logout().subscribe({
      complete: () => { this.userOpen = false; location.assign('/'); },
      error: () => { this.userOpen = false; location.assign('/'); }
    });
  }
}
