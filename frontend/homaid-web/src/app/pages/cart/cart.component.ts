import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
<div class="container my-4">
  <h1 class="h3 mb-4"><i class="bi bi-cart3 text-primary"></i> Mon panier</h1>

  @if (cart.isEmpty()) {
    <div class="text-center py-5">
      <i class="bi bi-cart-x display-1 text-muted"></i>
      <h4 class="mt-3">Votre panier est vide</h4>
      <p class="text-muted">Découvrez nos produits et ajoutez-en au panier.</p>
      <a routerLink="/catalog" class="btn btn-primary">
        <i class="bi bi-bag"></i> Parcourir le catalogue
      </a>
    </div>
  } @else {
    <div class="row g-4">
      <!-- Lignes panier -->
      <div class="col-lg-8">
        @for (line of cart.lines(); track line.productId) {
          <div class="card mb-3 cart-line">
            <div class="card-body">
              <div class="row g-3 align-items-center">
                <div class="col-3 col-md-2">
                  <a [routerLink]="['/product', line.slug]">
                    <img [src]="line.imageUrl || 'https://picsum.photos/seed/' + line.slug + '/120/120'"
                         [alt]="line.name" class="img-fluid rounded" style="aspect-ratio:1; object-fit:cover">
                  </a>
                </div>
                <div class="col-9 col-md-5">
                  <h6 class="mb-1">
                    <a [routerLink]="['/product', line.slug]" class="text-decoration-none text-dark">{{ line.name }}</a>
                  </h6>
                  <small class="text-muted">SKU : {{ line.sku }}</small><br>
                  <span class="fw-bold text-primary">{{ line.unitPrice | money:line.currency }}</span>
                </div>
                <div class="col-7 col-md-3">
                  <div class="input-group input-group-sm">
                    <button class="btn btn-outline-secondary" (click)="setQty(line.productId, line.quantity - 1)">−</button>
                    <input type="number" class="form-control text-center" [ngModel]="line.quantity"
                           (ngModelChange)="setQty(line.productId, $event)" min="1" [max]="line.stockQuantity || 999">
                    <button class="btn btn-outline-secondary" (click)="setQty(line.productId, line.quantity + 1)">+</button>
                  </div>
                  @if (line.stockQuantity && line.quantity >= line.stockQuantity) {
                    <small class="text-warning"><i class="bi bi-exclamation-triangle-fill"></i> Stock max</small>
                  }
                </div>
                <div class="col-3 col-md-1 text-end">
                  <strong>{{ (line.unitPrice * line.quantity) | money:line.currency }}</strong>
                </div>
                <div class="col-2 col-md-1 text-end">
                  <button class="btn btn-sm btn-link text-danger" (click)="remove(line.productId, line.name)"
                          aria-label="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <button class="btn btn-outline-danger btn-sm" (click)="clear()">
          <i class="bi bi-trash"></i> Vider le panier
        </button>
        <a routerLink="/catalog" class="btn btn-outline-secondary btn-sm ms-2">
          <i class="bi bi-arrow-left"></i> Continuer mes achats
        </a>
      </div>

      <!-- Résumé -->
      <div class="col-lg-4">
        <div class="card sticky-top" style="top:80px">
          <div class="card-body">
            <h5 class="card-title">Résumé de commande</h5>
            <hr>
            <div class="d-flex justify-content-between mb-2">
              <span>Articles ({{ cart.itemCount() }})</span>
              <span>{{ cart.subtotal() | money:cart.currency() }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2 text-muted small">
              <span>Frais de livraison</span>
              <span><em>Calculé au checkout</em></span>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-3">
              <strong>Sous-total</strong>
              <strong class="text-primary">{{ cart.subtotal() | money:cart.currency() }}</strong>
            </div>
            <a routerLink="/checkout" class="btn btn-primary w-100">
              <i class="bi bi-credit-card"></i> Procéder au checkout
            </a>
            <p class="small text-muted text-center mt-3 mb-0">
              <i class="bi bi-shield-lock"></i> Paiement à la livraison ou virement bancaire
            </p>
          </div>
        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`.cart-line { transition: background .15s; } .cart-line:hover { background:#fafbfd; }`]
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
