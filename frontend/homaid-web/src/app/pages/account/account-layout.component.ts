import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="container my-4">
  <div class="row g-4">
    <aside class="col-md-3">
      <div class="card">
        <div class="card-body">
          <h6 class="text-muted text-uppercase small">Mon compte</h6>
          <strong>{{ auth.user()?.fullName }}</strong>
          <div class="text-muted small">{{ auth.user()?.email }}</div>
        </div>
        <div class="list-group list-group-flush">
          <a routerLink="/account" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
             class="list-group-item list-group-item-action">
            <i class="bi bi-person"></i> Profil
          </a>
          <a routerLink="/account/orders" routerLinkActive="active"
             class="list-group-item list-group-item-action">
            <i class="bi bi-bag-check"></i> Mes commandes
          </a>
          <a routerLink="/account/addresses" routerLinkActive="active"
             class="list-group-item list-group-item-action">
            <i class="bi bi-geo-alt"></i> Mes adresses
          </a>
          <a routerLink="/account/password" routerLinkActive="active"
             class="list-group-item list-group-item-action">
            <i class="bi bi-key"></i> Mot de passe
          </a>
        </div>
      </div>
    </aside>
    <section class="col-md-9">
      <router-outlet></router-outlet>
    </section>
  </div>
</div>
  `
})
export class AccountLayoutComponent {
  readonly auth = inject(AuthService);
}
