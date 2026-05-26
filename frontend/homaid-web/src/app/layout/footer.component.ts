import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
<footer class="bg-dark text-white-50 mt-5 pt-5 pb-3">
  <div class="container">
    <div class="row g-4">
      <div class="col-md-4">
        <h5 class="text-white"><i class="bi bi-bag-heart-fill text-primary me-1"></i> Homaid Store</h5>
        <p class="small">Boutique en ligne marocaine — paiement à la livraison ou virement à l'international.</p>
      </div>
      <div class="col-md-2">
        <h6 class="text-white">Boutique</h6>
        <ul class="list-unstyled small">
          <li><a class="text-white-50" routerLink="/">Accueil</a></li>
          <li><a class="text-white-50" routerLink="/catalog">Catalogue</a></li>
          <li><a class="text-white-50" routerLink="/cart">Panier</a></li>
        </ul>
      </div>
      <div class="col-md-3">
        <h6 class="text-white">Mon compte</h6>
        <ul class="list-unstyled small">
          <li><a class="text-white-50" routerLink="/account">Profil</a></li>
          <li><a class="text-white-50" routerLink="/account/orders">Mes commandes</a></li>
          <li><a class="text-white-50" routerLink="/login">Connexion</a></li>
        </ul>
      </div>
      <div class="col-md-3">
        <h6 class="text-white">Légal</h6>
        <ul class="list-unstyled small">
          <li><a class="text-white-50" routerLink="/legal/cgv">CGV</a></li>
          <li><a class="text-white-50" routerLink="/legal/privacy">Confidentialité</a></li>
          <li><a class="text-white-50" routerLink="/legal/cookies">Cookies</a></li>
        </ul>
      </div>
    </div>
    <hr class="border-secondary mt-4">
    <div class="d-flex justify-content-between small">
      <span>&copy; {{ year }} Homaid Store · RGPD & loi 09-08 Maroc</span>
      <span>Made with <i class="bi bi-heart-fill text-danger"></i></span>
    </div>
  </div>
</footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
