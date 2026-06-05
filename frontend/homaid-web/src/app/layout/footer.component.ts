import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
<footer class="main-footer">
  <div class="container">
    <div class="row g-4">
      <div class="col-md-4">
        <h6 style="font-family:'Playfair Display'; font-size:1.8rem; letter-spacing:.14em; color:#fff; text-transform:none; font-weight:700;">
          VELISSE
        </h6>
        <div class="brand-tagline mb-3" style="font-size:.65rem; letter-spacing:.3em; color:var(--velisse-rose-gold); text-transform:uppercase">
          Skincare · Beauty · Care
        </div>
        <p class="small" style="line-height:1.7">{{ 'footer.tagline' | translate }}</p>
        <div class="d-flex gap-2 mt-3">
          <a href="#" aria-label="Instagram" class="btn-icon-square" style="background:transparent; color:#fff; border-color:#444">
            <i class="bi bi-instagram"></i>
          </a>
          <a href="#" aria-label="Facebook" class="btn-icon-square" style="background:transparent; color:#fff; border-color:#444">
            <i class="bi bi-facebook"></i>
          </a>
          <a href="#" aria-label="TikTok" class="btn-icon-square" style="background:transparent; color:#fff; border-color:#444">
            <i class="bi bi-tiktok"></i>
          </a>
          <a href="#" aria-label="WhatsApp" class="btn-icon-square" style="background:transparent; color:#fff; border-color:#444">
            <i class="bi bi-whatsapp"></i>
          </a>
        </div>
      </div>

      <div class="col-6 col-md-2">
        <h6>{{ 'footer.shop' | translate }}</h6>
        <ul class="list-unstyled">
          <li class="mb-2"><a routerLink="/">{{ 'nav.home' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/catalog">{{ 'nav.catalog' | translate }}</a></li>
          <li class="mb-2"><a [routerLink]="['/catalog']" [queryParams]="{ featured: true }">{{ 'nav.promos' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/cart">{{ 'header.cart' | translate }}</a></li>
        </ul>
      </div>

      <div class="col-6 col-md-3">
        <h6>{{ 'footer.my_account' | translate }}</h6>
        <ul class="list-unstyled">
          <li class="mb-2"><a routerLink="/account">{{ 'header.my_profile' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/account/orders">{{ 'header.my_orders' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/login">{{ 'auth.login_title' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/register">{{ 'auth.create_account' | translate }}</a></li>
        </ul>
      </div>

      <div class="col-md-3">
        <h6>{{ 'footer.help_legal' | translate }}</h6>
        <ul class="list-unstyled">
          <li class="mb-2"><a routerLink="/legal/contact"><i class="bi bi-envelope me-1"></i> {{ 'footer.contact' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/legal/cgv">{{ 'footer.tos' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/legal/privacy">{{ 'footer.privacy' | translate }}</a></li>
          <li class="mb-2"><a routerLink="/legal/cookies">{{ 'footer.cookies' | translate }}</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom d-flex justify-content-between flex-wrap gap-2">
      <span>&copy; {{ year }} Velisse · {{ 'footer.rights' | translate }}</span>
      <span>{{ 'footer.compliance' | translate }}</span>
    </div>
  </div>
</footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
