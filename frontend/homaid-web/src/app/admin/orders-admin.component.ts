import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagedResult } from '../core/models/api.models';
import { OrderList, OrderStatus, PaymentStatus } from '../core/models/order.models';
import { ApiService } from '../core/services/api.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
<h1 class="h3 mb-3">Commandes</h1>

<div class="card mb-3">
  <div class="card-body">
    <div class="row g-2">
      <div class="col-md-4">
        <input class="form-control" placeholder="Rechercher (n°, email, nom, tel)"
               [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
      </div>
      <div class="col-md-3">
        <select class="form-select" [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()">
          <option [ngValue]="undefined">Tous les statuts</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Preparing">Preparing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select" [(ngModel)]="filters.paymentStatus" (ngModelChange)="onFilterChange()">
          <option [ngValue]="undefined">Tous les paiements</option>
          <option value="Pending">Pending</option>
          <option value="AwaitingTransfer">AwaitingTransfer</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-outline-secondary w-100" (click)="reset()">
          <i class="bi bi-x-circle"></i> Reset
        </button>
      </div>
    </div>
  </div>
</div>

@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
} @else if (!page() || page()!.items.length === 0) {
  <div class="alert alert-info">Aucune commande.</div>
} @else {
  <div class="card">
    <div class="table-responsive">
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light">
          <tr>
            <th>N°</th><th>Client</th><th>Articles</th><th>Total</th>
            <th>Paiement</th><th>Statut</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          @for (o of page()!.items; track o.id) {
            <tr>
              <td><code>{{ o.orderNumber }}</code></td>
              <td>
                <strong>{{ o.customerName }}</strong><br>
                <small class="text-muted">{{ o.customerEmail }}</small>
              </td>
              <td>{{ o.itemCount }}</td>
              <td><strong>{{ o.total | money:o.currency }}</strong></td>
              <td>
                <small class="d-block">{{ o.paymentMethod === 'CashOnDelivery' ? 'COD' : 'Virement' }}</small>
                <span class="badge" [ngClass]="paymentClass(o.paymentStatus)">{{ o.paymentStatus }}</span>
              </td>
              <td><span class="badge" [ngClass]="statusClass(o.status)">{{ o.status }}</span></td>
              <td><small>{{ o.createdAt | date:'short' }}</small></td>
              <td>
                <a [routerLink]="['/admin/orders', o.id]" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-eye"></i>
                </a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (page()!.totalPages > 1) {
      <div class="card-footer d-flex justify-content-center">
        <nav><ul class="pagination mb-0">
          <li class="page-item" [class.disabled]="!page()!.hasPrevious">
            <button class="page-link" (click)="goToPage(page()!.page - 1)"><i class="bi bi-chevron-left"></i></button>
          </li>
          <li class="page-item disabled"><span class="page-link">{{ page()!.page }} / {{ page()!.totalPages }}</span></li>
          <li class="page-item" [class.disabled]="!page()!.hasNext">
            <button class="page-link" (click)="goToPage(page()!.page + 1)"><i class="bi bi-chevron-right"></i></button>
          </li>
        </ul></nav>
      </div>
    }
  </div>
}
  `
})
export class OrdersAdminComponent {
  private api = inject(ApiService);

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
