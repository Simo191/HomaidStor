import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderDetail, OrderStatus } from '../../core/models/order.models';
import { ApiException } from '../../core/services/api.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { OrderStatusLabelPipe, PaymentStatusLabelPipe } from '../../shared/pipes/order-labels.pipes';

@Component({
  selector: 'app-account-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, OrderStatusLabelPipe, PaymentStatusLabelPipe],
  template: `
@if (loading()) {
  <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
} @else if (!order()) {
  <div class="alert alert-warning">Commande introuvable.</div>
} @else {
<div class="card mb-3">
  <div class="card-header bg-white d-flex justify-content-between">
    <strong>Commande <code>{{ order()!.orderNumber }}</code></strong>
    <span class="badge" [ngClass]="statusClass(order()!.status)">{{ order()!.status | orderStatusLabel }}</span>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-6">
        <h6>Adresse de livraison</h6>
        <address class="small">
          {{ order()!.shippingAddress.fullName }}<br>
          {{ order()!.shippingAddress.street }}
          @if (order()!.shippingAddress.streetComplement) { <br>{{ order()!.shippingAddress.streetComplement }} }
          <br>{{ order()!.shippingAddress.city }}@if (order()!.shippingAddress.postalCode) { · {{ order()!.shippingAddress.postalCode }} }
          <br>{{ order()!.shippingAddress.countryCode }}<br>
          <i class="bi bi-telephone"></i> {{ order()!.shippingAddress.phone }}
        </address>
      </div>
      <div class="col-md-6">
        <h6>Paiement</h6>
        <p class="small mb-1">
          @if (order()!.paymentMethod === 'CashOnDelivery') {
            <i class="bi bi-cash-coin"></i> À la livraison
          } @else {
            <i class="bi bi-bank"></i> Virement bancaire
          }
          · <span class="badge bg-secondary">{{ order()!.paymentStatus | paymentStatusLabel }}</span>
        </p>
        @if (order()!.shippingMethodName) {
          <h6 class="mt-2">Livraison</h6>
          <p class="small">{{ order()!.shippingMethodName }}</p>
        }
      </div>
    </div>
  </div>
</div>

<div class="card mb-3">
  <div class="card-header bg-white"><strong>Articles</strong></div>
  <div class="card-body">
    @for (i of order()!.items; track i.id) {
      <div class="d-flex gap-2 mb-2">
        @if (i.productImageUrl) {
          <img [src]="i.productImageUrl" class="rounded" style="width:60px;height:60px;object-fit:cover" [alt]="i.productName">
        }
        <div class="flex-grow-1">
          <strong>{{ i.productName }}</strong>
          <div class="small text-muted">SKU {{ i.productSku }} · × {{ i.quantity }}</div>
        </div>
        <div class="fw-bold">{{ i.lineTotal | money:order()!.currency }}</div>
      </div>
    }
    <hr>
    <div class="d-flex justify-content-between"><span>Sous-total</span><span>{{ order()!.subtotal | money:order()!.currency }}</span></div>
    <div class="d-flex justify-content-between"><span>Livraison</span><span>{{ order()!.shippingFee | money:order()!.currency }}</span></div>
    <div class="d-flex justify-content-between fs-5 mt-2"><strong>Total</strong><strong class="text-primary">{{ order()!.total | money:order()!.currency }}</strong></div>
  </div>
</div>

<!-- Historique -->
<div class="card mb-3">
  <div class="card-header bg-white"><strong>Historique</strong></div>
  <ul class="list-group list-group-flush">
    @for (h of order()!.statusHistory; track h.changedAt) {
      <li class="list-group-item small">
        <i class="bi bi-circle-fill text-primary me-2" style="font-size:.6rem"></i>
        <strong>{{ h.toStatus | orderStatusLabel }}</strong>
        <span class="text-muted">— {{ h.changedAt | date:'short' }}</span>
        @if (h.notes) { <div class="ms-4 text-muted">{{ h.notes }}</div> }
      </li>
    }
  </ul>
</div>

@if (canCancel()) {
  <button class="btn btn-outline-danger" (click)="cancel()">
    <i class="bi bi-x-circle"></i> Annuler la commande
  </button>
}
<a routerLink="/account/orders" class="btn btn-outline-secondary">
  <i class="bi bi-arrow-left"></i> Retour à mes commandes
</a>
}
  `
})
export class OrderDetailAccountComponent {
  private orders = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  order = signal<OrderDetail | null>(null);
  loading = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/account/orders']); return; }
    this.orders.getMine(id).subscribe({
      next: o => { this.order.set(o); this.loading.set(false); },
      error: () => { this.order.set(null); this.loading.set(false); }
    });
  }

  canCancel(): boolean {
    const s = this.order()?.status;
    return s === 'Pending' || s === 'Confirmed' || s === 'Preparing';
  }

  cancel(): void {
    const reason = prompt(`Motif d'annulation (optionnel)`) ?? undefined;
    if (reason === null) return;
    const id = this.order()!.id;
    this.orders.cancelMine(id, reason).subscribe({
      next: () => {
        this.toast.success('Commande annulée.');
        this.orders.getMine(id).subscribe(o => this.order.set(o));
      },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  statusClass(s: OrderStatus): string {
    return {
      Pending: 'bg-warning text-dark',
      Confirmed: 'bg-info',
      Preparing: 'bg-primary',
      Shipped: 'bg-info',
      Delivered: 'bg-success',
      Cancelled: 'bg-secondary',
      Refunded: 'bg-secondary'
    }[s] || 'bg-secondary';
  }
}
