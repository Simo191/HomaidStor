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
        <h6 style="font-family:'Playfair Display'; font-size:1.5rem; letter-spacing:.04em; color:#fff; text-transform:none;">
          Homaid<span style="color:var(--homaid-primary)">.</span>
        </h6>
        <p class="small mt-3" style="line-height:1.7">
          Votre boutique en ligne marocaine — produits authentiques, paiement à la livraison et livraison rapide dans tout le Maroc.
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
      <span>&copy; {{ year }} Homaid Store · Tous droits réservés</span>
      <span>Conforme RGPD &amp; loi 09-08 (Maroc)</span>
    </div>
  </div>
</footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
