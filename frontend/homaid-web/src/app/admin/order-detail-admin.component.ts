import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderDetail, OrderStatus, PaymentStatus } from '../core/models/order.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';

@Component({
  selector: 'app-order-detail-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
} @else if (!order()) {
  <div class="alert alert-warning">Commande introuvable.</div>
} @else {

<div class="d-flex justify-content-between align-items-center mb-3">
  <h1 class="h4 mb-0">
    Commande <code>{{ order()!.orderNumber }}</code>
    <span class="badge ms-2" [ngClass]="statusClass(order()!.status)">{{ order()!.status }}</span>
  </h1>
  <a routerLink="/admin/orders" class="btn btn-sm btn-outline-secondary">
    <i class="bi bi-arrow-left"></i> Retour
  </a>
</div>

<div class="row g-3">
  <!-- Détails commande -->
  <div class="col-lg-8">
    <div class="card mb-3">
      <div class="card-header"><strong>Articles</strong></div>
      <div class="card-body">
        @for (i of order()!.items; track i.id) {
          <div class="d-flex gap-2 mb-2">
            @if (i.productImageUrl) {
              <img [src]="i.productImageUrl" class="rounded" style="width:60px;height:60px;object-fit:cover" [alt]="i.productName">
            }
            <div class="flex-grow-1">
              <strong>{{ i.productName }}</strong>
              <div class="small text-muted">SKU {{ i.productSku }} · × {{ i.quantity }} @ {{ i.unitPrice | money:order()!.currency }}</div>
            </div>
            <div class="fw-bold">{{ i.lineTotal | money:order()!.currency }}</div>
          </div>
        }
        <hr>
        <div class="d-flex justify-content-between"><span>Sous-total</span><span>{{ order()!.subtotal | money:order()!.currency }}</span></div>
        <div class="d-flex justify-content-between"><span>Livraison</span><span>{{ order()!.shippingFee | money:order()!.currency }}</span></div>
        <div class="d-flex justify-content-between fs-5"><strong>Total</strong><strong class="text-primary">{{ order()!.total | money:order()!.currency }}</strong></div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><strong>Historique</strong></div>
      <ul class="list-group list-group-flush">
        @for (h of order()!.statusHistory; track h.changedAt) {
          <li class="list-group-item small">
            <i class="bi bi-circle-fill text-primary me-2" style="font-size:.6rem"></i>
            <strong>{{ h.toStatus }}</strong>
            <span class="text-muted">— {{ h.changedAt | date:'short' }} — {{ h.changedBy }}</span>
            @if (h.notes) { <div class="ms-4 text-muted">{{ h.notes }}</div> }
          </li>
        }
      </ul>
    </div>
  </div>

  <!-- Sidebar actions -->
  <div class="col-lg-4">
    <!-- Client -->
    <div class="card mb-3">
      <div class="card-header"><strong>Client</strong></div>
      <div class="card-body small">
        <strong>{{ order()!.customerFullName }}</strong>
        @if (!order()!.customerId) {
          <span class="badge bg-secondary ms-1">Invité</span>
        }
        <div class="mt-2">
          <i class="bi bi-envelope"></i> <a [href]="'mailto:' + order()!.customerEmail">{{ order()!.customerEmail }}</a><br>
          <i class="bi bi-telephone"></i> <a [href]="'tel:' + order()!.customerPhone">{{ order()!.customerPhone }}</a>
        </div>
      </div>
    </div>

    <!-- Adresse -->
    <div class="card mb-3">
      <div class="card-header"><strong>Adresse de livraison</strong></div>
      <div class="card-body small">
        {{ order()!.shippingAddress.fullName }}<br>
        {{ order()!.shippingAddress.street }}
        @if (order()!.shippingAddress.streetComplement) { <br>{{ order()!.shippingAddress.streetComplement }} }
        <br>{{ order()!.shippingAddress.city }}@if (order()!.shippingAddress.postalCode) { , {{ order()!.shippingAddress.postalCode }} }
        <br><strong>{{ order()!.shippingAddress.countryCode }}</strong>
        @if (order()!.shippingMethodName) {
          <div class="mt-2 text-muted"><i class="bi bi-truck"></i> {{ order()!.shippingMethodName }}</div>
        }
      </div>
    </div>

    <!-- Status update -->
    <div class="card mb-3">
      <div class="card-header"><strong>Changer le statut</strong></div>
      <div class="card-body">
        <select class="form-select form-select-sm mb-2" [(ngModel)]="newStatus">
          <option [ngValue]="undefined">-- Choisir --</option>
          @for (s of allowedStatuses(); track s) { <option [value]="s">{{ s }}</option> }
        </select>
        <textarea class="form-control form-control-sm mb-2" rows="2" placeholder="Note (optionnel)"
                  [(ngModel)]="statusNote"></textarea>
        <button class="btn btn-primary btn-sm w-100" [disabled]="!newStatus || submitting()"
                (click)="changeStatus()">
          @if (submitting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
          Appliquer
        </button>
      </div>
    </div>

    <!-- Payment status -->
    <div class="card mb-3">
      <div class="card-header">
        <strong>Paiement</strong>
        <span class="badge ms-1" [ngClass]="paymentClass(order()!.paymentStatus)">{{ order()!.paymentStatus }}</span>
      </div>
      <div class="card-body small">
        Mode : @if (order()!.paymentMethod === 'CashOnDelivery') { <i class="bi bi-cash-coin"></i> COD }
        @else { <i class="bi bi-bank"></i> Virement }
        @if (order()!.bankTransferReference) {
          <div class="mt-2">Réf : <code>{{ order()!.bankTransferReference }}</code></div>
        }
        <hr>
        <select class="form-select form-select-sm mb-2" [(ngModel)]="newPaymentStatus">
          <option value="Pending">Pending</option>
          <option value="AwaitingTransfer">AwaitingTransfer</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option>
        </select>
        <input class="form-control form-control-sm mb-2" placeholder="Réf virement (optionnel)"
               [(ngModel)]="paymentReference">
        <button class="btn btn-outline-primary btn-sm w-100" (click)="updatePayment()">
          Mettre à jour
        </button>
      </div>
    </div>

    <!-- Internal notes -->
    <div class="card mb-3">
      <div class="card-header"><strong>Notes internes</strong></div>
      <div class="card-body">
        @if (order()!.customerNotes) {
          <div class="small text-muted mb-2">
            <strong>Client :</strong> {{ order()!.customerNotes }}
          </div>
        }
        <textarea class="form-control form-control-sm mb-2" rows="3"
                  [(ngModel)]="internalNotes" placeholder="Visible uniquement admin..."></textarea>
        <button class="btn btn-outline-secondary btn-sm w-100" (click)="saveNotes()">
          Sauvegarder
        </button>
      </div>
    </div>

    @if (order()!.status !== 'Cancelled' && order()!.status !== 'Delivered' && order()!.status !== 'Refunded') {
      <button class="btn btn-outline-danger btn-sm w-100" (click)="cancel()">
        <i class="bi bi-x-circle"></i> Annuler la commande
      </button>
    }
  </div>
</div>
}
  `
})
export class OrderDetailAdminComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  order = signal<OrderDetail | null>(null);
  loading = signal(true);
  submitting = signal(false);

  newStatus?: OrderStatus;
  statusNote = '';
  newPaymentStatus: PaymentStatus = 'Pending';
  paymentReference = '';
  internalNotes = '';

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string) {
    this.loading.set(true);
    this.api.get<OrderDetail>(`/admin/orders/${id}`).subscribe({
      next: o => {
        this.order.set(o);
        this.newPaymentStatus = o.paymentStatus;
        this.paymentReference = o.bankTransferReference ?? '';
        this.internalNotes = o.internalNotes ?? '';
        this.loading.set(false);
      },
      error: () => { this.order.set(null); this.loading.set(false); }
    });
  }

  allowedStatuses(): OrderStatus[] {
    const s = this.order()?.status;
    const map: Record<string, OrderStatus[]> = {
      Pending: ['Confirmed', 'Cancelled'],
      Confirmed: ['Preparing', 'Cancelled'],
      Preparing: ['Shipped', 'Cancelled'],
      Shipped: ['Delivered'],
      Delivered: ['Refunded']
    };
    return map[s ?? ''] || [];
  }

  changeStatus() {
    if (!this.newStatus || !this.order()) return;
    this.submitting.set(true);
    this.api.patch<OrderDetail>(`/admin/orders/${this.order()!.id}/status`,
      { status: this.newStatus, notes: this.statusNote || null }).subscribe({
      next: o => {
        this.order.set(o);
        this.toast.success(`Statut mis à jour : ${o.status}`);
        this.newStatus = undefined;
        this.statusNote = '';
        this.submitting.set(false);
      },
      error: (e: ApiException) => { this.toast.error(e.message); this.submitting.set(false); }
    });
  }

  updatePayment() {
    this.api.patch<OrderDetail>(`/admin/orders/${this.order()!.id}/payment`,
      { paymentStatus: this.newPaymentStatus, reference: this.paymentReference || null }).subscribe({
      next: o => { this.order.set(o); this.toast.success('Paiement mis à jour.'); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  saveNotes() {
    this.api.patch<OrderDetail>(`/admin/orders/${this.order()!.id}/internal-notes`,
      { internalNotes: this.internalNotes || null }).subscribe({
      next: o => { this.order.set(o); this.toast.success('Notes sauvegardées.'); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  cancel() {
    const reason = prompt(`Motif d'annulation`);
    if (reason === null) return;
    this.api.post<void>(`/admin/orders/${this.order()!.id}/cancel`, { reason }).subscribe({
      next: () => { this.toast.success('Commande annulée.'); this.load(this.order()!.id); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  statusClass(s: string): string {
    return ({
      Pending: 'bg-warning text-dark', Confirmed: 'bg-info', Preparing: 'bg-primary',
      Shipped: 'bg-info', Delivered: 'bg-success', Cancelled: 'bg-secondary', Refunded: 'bg-secondary'
    } as Record<string, string>)[s] || 'bg-secondary';
  }
  paymentClass(s: string): string {
    return ({
      Pending: 'bg-warning text-dark', AwaitingTransfer: 'bg-info', Received: 'bg-success',
      Cancelled: 'bg-secondary', Refunded: 'bg-secondary'
    } as Record<string, string>)[s] || 'bg-secondary';
  }
}
