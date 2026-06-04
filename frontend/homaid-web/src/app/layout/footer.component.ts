import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
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
        <p class="small" style="line-height:1.7">
          Parapharmacie &amp; Korean skincare — produits authentiques sélectionnés avec soin. Livraison partout au Maroc, paiement à la livraison.
        </p>
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
        <h6>Boutique</h6>
        <ul class="list-unstyled">
          <li class="mb-2"><a routerLink="/">Accueil</a></li>
          <li class="mb-2"><a routerLink="/catalog">Catalogue</a></li>
          <li class="mb-2"><a [routerLink]="['/catalog']" [queryParams]="{ featured: true }">Promos</a></li>
          <li class="mb-2"><a routerLink="/cart">Panier</a></li>
        </ul>
      </div>

      <div class="col-6 col-md-3">
        <h6>Mon compte</h6>
        <ul class="list-unstyled">
          <li class="mb-2"><a routerLink="/account">Mon profil</a></li>
          <li class="mb-2"><a routerLink="/account/orders">Mes commandes</a></li>
          <li class="mb-2"><a routerLink="/login">Connexion</a></li>
          <li class="mb-2"><a routerLink="/register">Créer un compte</a></li>
        </ul>
      </div>

      <div class="col-md-3">
        <h6>Aide & Légal</h6>
        <ul class="list-unstyled">
          <li class="mb-2"><a routerLink="/legal/contact"><i class="bi bi-envelope me-1"></i> Contactez-nous</a></li>
          <li class="mb-2"><a routerLink="/legal/cgv">CGV</a></li>
          <li class="mb-2"><a routerLink="/legal/privacy">Politique de confidentialité</a></li>
          <li class="mb-2"><a routerLink="/legal/cookies">Cookies</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom d-flex justify-content-between flex-wrap gap-2">
      <span>&copy; {{ year }} Velisse · Tous droits réservés</span>
      <span>Conforme RGPD &amp; loi 09-08 (Maroc)</span>
    </div>
  </div>
</footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
