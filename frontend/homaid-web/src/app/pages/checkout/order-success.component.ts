import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { OrderDetail } from '../../core/models/order.models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { OrderStatusLabelPipe } from '../../shared/pipes/order-labels.pipes';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, OrderStatusLabelPipe, TranslatePipe],
  template: `
<div class="container my-5">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="text-center mb-5">
        <div style="width:90px; height:90px; border-radius:50%; background:var(--velisse-rose-light); display:inline-flex; align-items:center; justify-content:center">
          <i class="bi bi-check-lg" style="font-size:3.2rem; color:var(--velisse-rose-gold)"></i>
        </div>
        <div class="section-sub mt-3 mb-2" style="color:var(--velisse-rose-gold); letter-spacing:.3em; font-size:.75rem; text-transform:uppercase; font-weight:500">
          {{ 'success.eyebrow' | translate }}
        </div>
        <h1 class="mb-2" style="font-size:clamp(1.75rem, 3vw, 2.5rem); font-weight:500">{{ 'success.title' | translate }}</h1>
        <div class="d-inline-flex align-items-center gap-2 my-2" style="color:var(--velisse-rose-gold)">
          <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
          <i class="bi bi-flower2" style="font-size:.7rem"></i>
          <span style="width:30px; height:1px; background:var(--velisse-rose-gold)"></span>
        </div>
        <p class="lead" style="color:var(--velisse-muted)">
          @if (orderNumber()) {
            {{ 'success.your_order' | translate }}
            <strong style="color:var(--velisse-rose-gold)">{{ orderNumber() }}</strong>
            {{ 'success.received' | translate }}
          } @else {
            {{ 'success.received_short' | translate }}
          }
        </p>
      </div>

      @if (order()) {
        <div class="card mb-4">
          <div class="card-header bg-white d-flex justify-content-between">
            <strong>{{ 'success.details' | translate }}</strong>
            <span class="badge bg-warning text-dark">{{ order()!.status | orderStatusLabel }}</span>
          </div>
          <div class="card-body">
            <dl class="row mb-0">
              <dt class="col-sm-4">{{ 'success.order_number' | translate }}</dt>
              <dd class="col-sm-8"><code>{{ order()!.orderNumber }}</code></dd>

              <dt class="col-sm-4">{{ 'success.email' | translate }}</dt>
              <dd class="col-sm-8">{{ order()!.customerEmail }}</dd>

              <dt class="col-sm-4">{{ 'success.phone' | translate }}</dt>
              <dd class="col-sm-8">{{ order()!.customerPhone }}</dd>

              <dt class="col-sm-4">{{ 'success.ship_to' | translate }}</dt>
              <dd class="col-sm-8">
                {{ order()!.shippingAddress.fullName }}<br>
                {{ order()!.shippingAddress.street }}
                @if (order()!.shippingAddress.streetComplement) { <br>{{ order()!.shippingAddress.streetComplement }} }
                <br>{{ order()!.shippingAddress.city }}
                @if (order()!.shippingAddress.postalCode) { · {{ order()!.shippingAddress.postalCode }} }
                <br>{{ order()!.shippingAddress.countryCode }}
              </dd>

              <dt class="col-sm-4">{{ 'success.shipping_method' | translate }}</dt>
              <dd class="col-sm-8">{{ order()!.shippingMethodName }}</dd>

              <dt class="col-sm-4">{{ 'success.payment_method' | translate }}</dt>
              <dd class="col-sm-8">
                @if (order()!.paymentMethod === 'CashOnDelivery') {
                  <i class="bi bi-cash-coin"></i> {{ 'payment_method.CashOnDelivery' | translate }}
                } @else {
                  <i class="bi bi-bank"></i> {{ 'payment_method.BankTransfer' | translate }}
                  <small class="d-block text-muted">{{ 'success.payment_bank_note' | translate }}</small>
                }
              </dd>
            </dl>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header bg-white"><strong>{{ 'success.items' | translate }}</strong></div>
          <div class="card-body">
            @for (item of order()!.items; track item.id) {
              <div class="d-flex gap-2 mb-2">
                @if (item.productImageUrl) {
                  <img [src]="item.productImageUrl" [alt]="item.productName"
                       class="rounded" style="width:60px; height:60px; object-fit:cover">
                }
                <div class="flex-grow-1">
                  <strong>{{ item.productName }}</strong>
                  <div class="small text-muted">{{ 'cart.sku' | translate }} {{ item.productSku }} · × {{ item.quantity }}</div>
                </div>
                <div class="text-end fw-bold">{{ item.lineTotal | money:order()!.currency }}</div>
              </div>
            }
            <hr>
            <div class="d-flex justify-content-between"><span>{{ 'success.subtotal' | translate }}</span><span>{{ order()!.subtotal | money:order()!.currency }}</span></div>
            <div class="d-flex justify-content-between"><span>{{ 'success.shipping' | translate }}</span><span>{{ order()!.shippingFee | money:order()!.currency }}</span></div>
            <div class="d-flex justify-content-between fs-5 mt-2"><strong>{{ 'success.total' | translate }}</strong><strong class="text-primary">{{ order()!.total | money:order()!.currency }}</strong></div>
          </div>
        </div>
      } @else {
        <div class="alert alert-info">{{ 'success.no_details' | translate }}</div>
      }

      <div class="text-center">
        <a routerLink="/catalog" class="btn btn-primary">
          <i class="bi bi-bag"></i> {{ 'success.continue_shopping' | translate }}
        </a>
        @if (orderNumber()) {
          <a [routerLink]="['/account/orders']" class="btn btn-outline-secondary ms-2">
            {{ 'success.track_order' | translate }}
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
