import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
<div class="container my-4 my-md-5">

  <!-- Page title -->
  <div class="text-center mb-5">
    <div class="section-sub" style="color:var(--velisse-rose-gold); letter-spacing:.35em; font-size:.78rem; text-transform:uppercase; font-weight:500">
      Panier
    </div>
    <h1 style="font-size:clamp(1.75rem, 3vw, 2.5rem); font-weight:500; margin-top:.5rem">Mon panier</h1>
    <div class="section-line d-inline-flex align-items-center gap-2 mt-2" style="color:var(--velisse-rose-gold)">
      <span style="width:40px; height:1px; background:var(--velisse-rose-gold); display:inline-block"></span>
      <i class="bi bi-flower2"></i>
      <span style="width:40px; height:1px; background:var(--velisse-rose-gold); display:inline-block"></span>
    </div>
  </div>

  @if (cart.isEmpty()) {
    <div class="text-center py-5">
      <i class="bi bi-bag-x display-1" style="color:var(--velisse-rose-soft)"></i>
      <h4 class="mt-3" style="font-weight:500">Votre panier est vide</h4>
      <p style="color:var(--velisse-muted)">Découvrez nos produits skincare et beauté.</p>
      <a routerLink="/catalog" class="btn btn-dark btn-uppercase mt-3">
        Parcourir le catalogue <i class="bi bi-arrow-right ms-2"></i>
      </a>
    </div>
  } @else {
    <div class="row g-4">
      <!-- Lignes panier -->
      <div class="col-lg-8">
        @for (line of cart.lines(); track line.productId) {
          <div class="cart-line p-3 mb-3">
            <div class="row g-3 align-items-center">
              <div class="col-3 col-md-2">
                <a [routerLink]="['/product', line.slug]" style="display:block; background:var(--velisse-rose-bg)">
                  <img [src]="line.imageUrl || 'https://picsum.photos/seed/' + line.slug + '/120/120'"
                       [alt]="line.name" class="img-fluid" style="aspect-ratio:1; object-fit:cover">
                </a>
              </div>
              <div class="col-9 col-md-5">
                <h6 class="mb-1" style="font-family:'Poppins'; font-weight:500">
                  <a [routerLink]="['/product', line.slug]" class="text-decoration-none" style="color:var(--velisse-text)">{{ line.name }}</a>
                </h6>
                <small style="color:var(--velisse-muted)">SKU : {{ line.sku }}</small><br>
                <span class="fw-semibold" style="color:var(--velisse-rose-gold)">{{ line.unitPrice | money:line.currency }}</span>
              </div>
              <div class="col-7 col-md-3">
                <div class="qty-control">
                  <button type="button" class="qty-btn" (click)="setQty(line.productId, line.quantity - 1)">−</button>
                  <input type="number" class="qty-input" [ngModel]="line.quantity"
                         (ngModelChange)="setQty(line.productId, $event)" min="1" [max]="line.stockQuantity || 999">
                  <button type="button" class="qty-btn" (click)="setQty(line.productId, line.quantity + 1)">+</button>
                </div>
                @if (line.stockQuantity && line.quantity >= line.stockQuantity) {
                  <small class="text-warning"><i class="bi bi-exclamation-triangle-fill"></i> Stock max</small>
                }
              </div>
              <div class="col-3 col-md-1 text-end">
                <strong>{{ (line.unitPrice * line.quantity) | money:line.currency }}</strong>
              </div>
              <div class="col-2 col-md-1 text-end">
                <button class="btn btn-sm btn-link p-0" (click)="remove(line.productId, line.name)"
                        style="color:var(--velisse-muted)" aria-label="Supprimer">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
        }

        <div class="d-flex flex-wrap gap-2 mt-3">
          <button class="btn btn-outline-dark btn-sm" (click)="clear()">
            <i class="bi bi-trash me-1"></i> Vider le panier
          </button>
          <a routerLink="/catalog" class="btn btn-link btn-sm" style="color:var(--velisse-rose-gold)">
            <i class="bi bi-arrow-left me-1"></i> Continuer mes achats
          </a>
        </div>
      </div>

      <!-- Résumé -->
      <div class="col-lg-4">
        <div class="order-summary p-4 sticky-top" style="top:90px">
          <h5 class="mb-3" style="font-family:'Playfair Display'; font-weight:600">Résumé</h5>
          <div class="d-flex justify-content-between mb-2">
            <span style="color:var(--velisse-muted)">Articles ({{ cart.itemCount() }})</span>
            <span>{{ cart.subtotal() | money:cart.currency() }}</span>
          </div>
          <div class="d-flex justify-content-between mb-3 small" style="color:var(--velisse-muted)">
            <span>Frais de livraison</span>
            <span><em>Calculé au checkout</em></span>
          </div>
          <hr style="border-color:var(--velisse-border)">
          <div class="d-flex justify-content-between mb-3">
            <strong>Sous-total</strong>
            <strong style="color:var(--velisse-rose-gold); font-size:1.15rem">{{ cart.subtotal() | money:cart.currency() }}</strong>
          </div>
          <a routerLink="/checkout" class="btn btn-dark w-100 btn-uppercase">
            Procéder au checkout <i class="bi bi-arrow-right ms-1"></i>
          </a>
          <p class="small text-center mt-3 mb-0" style="color:var(--velisse-muted)">
            <i class="bi bi-shield-lock me-1"></i> Paiement sécurisé
          </p>
        </div>
      </div>
    </div>
  }
</div>
  `
})
export class CartComponent {
  readonly cart = inject(CartService);
  private toast = inject(ToastService);

  setQty(productId: string, qty: number): void {
    if (qty < 1) { this.remove(productId); return; }
    this.cart.setQuantity(productId, qty);
  }

  remove(productId: string, name?: string): void {
    this.cart.remove(productId);
    if (name) this.toast.info(`${name} retiré du panier`);
  }

  clear(): void {
    if (confirm('Vider tout le panier ?')) {
      this.cart.clear();
      this.toast.info('Panier vidé');
    }
  }
}
