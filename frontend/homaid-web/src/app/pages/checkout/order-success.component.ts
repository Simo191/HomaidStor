import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderDetail } from '../../core/models/order.models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
<div class="container my-5">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="text-center mb-5">
        <div style="width:90px; height:90px; border-radius:50%; background:var(--velisse-rose-light); display:inline-flex; align-items:center; justify-content:center">
          <i class="bi bi-check-lg" style="font-size:3.2rem; color:var(--velisse-rose-gold)"></i>
        </div>
        <div class="section-sub mt-3 mb-2" style="color:var(--velisse-rose-gold); letter-spacing:.3em; font-size:.75rem; text-transform:uppercase; font-weight:500">
          Commande confirmée
        </div>
        <h1 class="mb-2" style="font-size:clamp(1.75rem, 3vw, 2.5rem); font-weight:500">Merci pour votre commande !</h1>
        <div class="d-inline-flex align-items-center gap-2 my-2" style="color:var(--velisse-rose-gold)">
          <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
          <i class="bi bi-flower2" style="font-size:.7rem"></i>
          <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
        </div>
        <p class="lead" style="color:var(--velisse-muted)">
          @if (orderNumber()) {
            Votre commande <strong style="color:var(--velisse-rose-gold)">{{ orderNumber() }}</strong> a bien été enregistrée.
          } @else {
            Votre commande a bien été enregistrée.
          }
        </p>
      </div>

      @if (order()) {
        <div class="card mb-4">
          <div class="card-header bg-white d-flex justify-content-between">
            <strong>Détails</strong>
            <span class="badge bg-warning text-dark">{{ order()!.status }}</span>
          </div>
          <div class="card-body">
            <dl class="row mb-0">
              <dt class="col-sm-4">Numéro de commande</dt>
              <dd class="col-sm-8"><code>{{ order()!.orderNumber }}</code></dd>

              <dt class="col-sm-4">Email</dt>
              <dd class="col-sm-8">{{ order()!.customerEmail }}</dd>

              <dt class="col-sm-4">Téléphone</dt>
              <dd class="col-sm-8">{{ order()!.customerPhone }}</dd>

              <dt class="col-sm-4">Livraison à</dt>
              <dd class="col-sm-8">
                {{ order()!.shippingAddress.fullName }}<br>
                {{ order()!.shippingAddress.street }}
                @if (order()!.shippingAddress.streetComplement) { <br>{{ order()!.shippingAddress.streetComplement }} }
                <br>{{ order()!.shippingAddress.city }}
                @if (order()!.shippingAddress.postalCode) { · {{ order()!.shippingAddress.postalCode }} }
                <br>{{ order()!.shippingAddress.countryCode }}
              </dd>

              <dt class="col-sm-4">Mode de livraison</dt>
              <dd class="col-sm-8">{{ order()!.shippingMethodName }}</dd>

              <dt class="col-sm-4">Mode de paiement</dt>
              <dd class="col-sm-8">
                @if (order()!.paymentMethod === 'CashOnDelivery') {
                  <i class="bi bi-cash-coin"></i> Paiement à la livraison
                } @else {
                  <i class="bi bi-bank"></i> Virement bancaire
                  <small class="d-block text-muted">Vous recevrez un email avec le RIB.</small>
                }
              </dd>
            </dl>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header bg-white"><strong>Articles</strong></div>
          <div class="card-body">
            @for (item of order()!.items; track item.id) {
              <div class="d-flex gap-2 mb-2">
                @if (item.productImageUrl) {
                  <img [src]="item.productImageUrl" [alt]="item.productName"
                       class="rounded" style="width:60px; height:60px; object-fit:cover">
                }
                <div class="flex-grow-1">
                  <strong>{{ item.productName }}</strong>
                  <div class="small text-muted">SKU {{ item.productSku }} · × {{ item.quantity }}</div>
                </div>
                <div class="text-end fw-bold">{{ item.lineTotal | money:order()!.currency }}</div>
              </div>
            }
            <hr>
            <div class="d-flex justify-content-between"><span>Sous-total</span><span>{{ order()!.subtotal | money:order()!.currency }}</span></div>
            <div class="d-flex justify-content-between"><span>Livraison</span><span>{{ order()!.shippingFee | money:order()!.currency }}</span></div>
            <div class="d-flex justify-content-between fs-5 mt-2"><strong>Total</strong><strong class="text-primary">{{ order()!.total | money:order()!.currency }}</strong></div>
          </div>
        </div>
      } @else {
        <div class="alert alert-info">
          Un email de confirmation va vous être envoyé sous peu.
        </div>
      }

      <div class="text-center">
        <a routerLink="/catalog" class="btn btn-primary">
          <i class="bi bi-bag"></i> Continuer mes achats
        </a>
        @if (orderNumber()) {
          <a [routerLink]="['/account/orders']" class="btn btn-outline-secondary ms-2">
            Suivre ma commande
          </a>
        }
      </div>
    </div>
  </div>
</div>
  `
})
export class OrderSuccessComponent {
  private route = inject(ActivatedRoute);

  orderNumber = signal<string | null>(null);
  order = signal<OrderDetail | null>(null);

  constructor() {
    this.orderNumber.set(this.route.snapshot.paramMap.get('orderNumber'));
    const state = history.state as { order?: OrderDetail };
    if (state?.order) this.order.set(state.order);
  }
}
