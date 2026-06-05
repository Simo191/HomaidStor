import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PagedResult } from '../core/models/api.models';
import { OrderList, OrderStatus, PaymentStatus } from '../core/models/order.models';
import { ApiService } from '../core/services/api.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';
import { OrderStatusLabelPipe, PaymentMethodLabelPipe, PaymentStatusLabelPipe } from '../shared/pipes/order-labels.pipes';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, MoneyPipe, OrderStatusLabelPipe, PaymentStatusLabelPipe, PaymentMethodLabelPipe],
  template: `
<div class="page-header">
  <div>
    <h1>Commandes</h1>
    <p class="page-sub">{{ page()?.totalCount ?? 0 }} commande(s) au total</p>
  </div>
  <div class="view-toggle">
    <a routerLink="/admin/orders" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="btn">
      <i class="bi bi-table"></i> Vue tableau
    </a>
    <a routerLink="/admin/orders/board" routerLinkActive="active" class="btn">
      <i class="bi bi-kanban"></i> Vue kanban
    </a>
  </div>
</div>

<div class="filters-bar-modern">
  <div class="row g-2 align-items-center">
    <div class="col-md-4">
      <div class="position-relative">
        <i class="bi bi-search filter-icon"></i>
        <input class="form-control ps-5" placeholder="Rechercher (n°, email, nom, téléphone)"
               [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
      </div>
    </div>
    <div class="col-md-3">
      <select class="form-select" [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()">
        <option [ngValue]="undefined">Tous les statuts</option>
        <option value="Pending">En attente</option>
        <option value="Confirmed">Confirmée</option>
        <option value="Preparing">En préparation</option>
        <option value="Shipped">Expédiée</option>
        <option value="Delivered">Livrée</option>
        <option value="Cancelled">Annulée</option>
        <option value="Refunded">Remboursée</option>
      </select>
    </div>
    <div class="col-md-3">
      <select class="form-select" [(ngModel)]="filters.paymentStatus" (ngModelChange)="onFilterChange()">
        <option [ngValue]="undefined">Tous les paiements</option>
        <option value="Pending">En attente</option>
        <option value="AwaitingTransfer">Virement en attente</option>
        <option value="Received">Reçu</option>
        <option value="Cancelled">Annulé</option>
        <option value="Refunded">Remboursé</option>
      </select>
    </div>
    <div class="col-md-2">
      <button class="btn btn-outline-secondary w-100" (click)="reset()">
        <i class="bi bi-arrow-clockwise"></i> Réinitialiser
      </button>
    </div>
  </div>
</div>

@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border" style="color:var(--velisse-rose-gold)"></div></div>
} @else if (!page() || page()!.items.length === 0) {
  <div class="empty-state">
    <i class="bi bi-receipt display-4"></i>
    <p>Aucune commande ne correspond à vos filtres.</p>
  </div>
} @else {
  <div class="modern-table-wrapper">
    <div class="table-responsive">
      <table class="modern-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Client</th>
            <th class="text-center">Articles</th>
            <th class="text-end">Total</th>
            <th>Paiement</th>
            <th>Statut</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (o of page()!.items; track o.id) {
            <tr>
              <td>
                <a [routerLink]="['/admin/orders', o.id]" class="order-number">{{ o.orderNumber }}</a>
              </td>
              <td class="customer-cell">
                <strong>{{ o.customerName }}</strong>
                <div class="email">{{ o.customerEmail }}</div>
              </td>
              <td class="text-center">
                <span class="count-circle">{{ o.itemCount }}</span>
              </td>
              <td class="total-cell text-end">{{ o.total | money:o.currency }}</td>
              <td>
                <div class="payment-method-label mb-1">
                  @if (o.paymentMethod === 'CashOnDelivery') { <i class="bi bi-cash-coin"></i> }
                  @else { <i class="bi bi-bank"></i> }
                  {{ o.paymentMethod | paymentMethodLabel:true }}
                </div>
                <span class="status-pill" [ngClass]="paymentPillClass(o.paymentStatus)">
                  {{ o.paymentStatus | paymentStatusLabel }}
                </span>
              </td>
              <td>
                <span class="status-pill" [ngClass]="statusPillClass(o.status)">
                  {{ o.status | orderStatusLabel }}
                </span>
              </td>
              <td class="date-cell">
                {{ o.createdAt | date:'mediumDate' }}
                <span class="time">{{ o.createdAt | date:'HH:mm' }}</span>
              </td>
              <td>
                <a [routerLink]="['/admin/orders', o.id]" class="row-action-btn" title="Voir le détail">
                  <i class="bi bi-eye"></i>
                </a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (page()!.totalPages > 1) {
      <div class="table-footer">
        <small class="text-muted">
          {{ ((page()!.page - 1) * page()!.pageSize) + 1 }} -
          {{ Math.min(page()!.page * page()!.pageSize, page()!.totalCount) }}
          sur {{ page()!.totalCount }}
        </small>
        <div class="d-flex gap-2 align-items-center">
          <button class="row-action-btn" [disabled]="!page()!.hasPrevious" (click)="goToPage(page()!.page - 1)">
            <i class="bi bi-chevron-left"></i>
          </button>
          <small class="text-muted">Page {{ page()!.page }} / {{ page()!.totalPages }}</small>
          <button class="row-action-btn" [disabled]="!page()!.hasNext" (click)="goToPage(page()!.page + 1)">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    }
  </div>
}
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; align-items:end; margin-bottom:1.5rem; }
    .page-header h1 { font-family:'Playfair Display', Georgia, serif; font-size:1.85rem; font-weight:600; margin:0; color:var(--velisse-brown); }
    .page-sub { color:#8B7068; font-size:.9rem; margin:0; }

    .filter-icon {
      position:absolute; left:1rem; top:50%; transform:translateY(-50%);
      color:#8B7068; font-size:.95rem; pointer-events:none;
    }

    .count-circle {
      display:inline-flex; align-items:center; justify-content:center;
      width:28px; height:28px; border-radius:50%;
      background:#FBE9E5; color:var(--velisse-rose-gold);
      font-weight:600; font-size:.85rem;
    }

    .empty-state {
      background:#fff; border:1px dashed #EDE4DE; border-radius:14px;
      padding:3rem; text-align:center; color:#8B7068;
    }
    .empty-state i { color:#D5C2BB; }

    .table-footer {
      display:flex; justify-content:space-between; align-items:center;
      padding:.85rem 1.25rem;
      background:#FAF7F4;
      border-top:1px solid #EDE4DE;
    }
    .row-action-btn:disabled { opacity:.4; cursor:not-allowed; }
  `]
})
export class OrdersAdminComponent {
  private api = inject(ApiService);
  Math = Math;

  page = signal<PagedResult<OrderList> | null>(null);
  loading = signal(true);
  filters: { search?: string; status?: OrderStatus; paymentStatus?: PaymentStatus; page: number; pageSize: number } = {
    page: 1, pageSize: 20
  };

  private debounce?: ReturnType<typeof setTimeout>;

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PagedResult<OrderList>>('/admin/orders', this.filters as Record<string, unknown>).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); this.page.set(null); }
    });
  }

  onFilterChange() {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.filters.page = 1; this.load(); }, 300);
  }

  reset() { this.filters = { page: 1, pageSize: 20 }; this.load(); }
  goToPage(p: number) { this.filters.page = p; this.load(); }

  statusPillClass(s: string): string {
    return ({
      Pending:   'pill-pending',
      Confirmed: 'pill-confirmed',
      Preparing: 'pill-preparing',
      Shipped:   'pill-shipped',
      Delivered: 'pill-delivered',
      Cancelled: 'pill-cancelled',
      Refunded:  'pill-refunded'
    } as Record<string, string>)[s] || 'pill-pending';
  }
  paymentPillClass(s: string): string {
    return ({
      Pending:          'pill-pay-pending',
      AwaitingTransfer: 'pill-pay-awaiting',
      Received:         'pill-pay-received',
      Cancelled:        'pill-pay-cancelled',
      Refunded:         'pill-pay-refunded'
    } as Record<string, string>)[s] || 'pill-pay-pending';
  }
}
