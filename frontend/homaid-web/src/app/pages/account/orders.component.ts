import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PagedResult } from '../../core/models/api.models';
import { OrderList, OrderStatus } from '../../core/models/order.models';
import { OrderService } from '../../core/services/order.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { OrderStatusLabelPipe } from '../../shared/pipes/order-labels.pipes';

@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, OrderStatusLabelPipe],
  template: `
<div class="card">
  <div class="card-header bg-white"><h5 class="mb-0">Mes commandes</h5></div>
  <div class="card-body">
    @if (loading()) {
      <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
    } @else if (!page() || page()!.items.length === 0) {
      <div class="text-center py-4 text-muted">
        <i class="bi bi-bag-x display-4"></i>
        <p class="mt-2">Vous n'avez aucune commande pour l'instant.</p>
        <a routerLink="/catalog" class="btn btn-primary">Découvrir le catalogue</a>
      </div>
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr>
            <th>N°</th>
            <th>Date</th>
            <th>Articles</th>
            <th>Total</th>
            <th>Statut</th>
            <th></th>
          </tr></thead>
          <tbody>
            @for (o of page()!.items; track o.id) {
              <tr>
                <td><code>{{ o.orderNumber }}</code></td>
                <td><small>{{ o.createdAt | date:'short' }}</small></td>
                <td>{{ o.itemCount }}</td>
                <td><strong>{{ o.total | money:o.currency }}</strong></td>
                <td><span class="badge" [ngClass]="statusClass(o.status)">{{ o.status | orderStatusLabel }}</span></td>
                <td>
                  <a [routerLink]="['/account/orders', o.id]" class="btn btn-sm btn-outline-primary">
                    Détails
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (page()!.totalPages > 1) {
        <nav>
          <ul class="pagination justify-content-center">
            <li class="page-item" [class.disabled]="!page()!.hasPrevious">
              <button class="page-link" (click)="loadPage(page()!.page - 1)"><i class="bi bi-chevron-left"></i></button>
            </li>
            <li class="page-item disabled"><span class="page-link">{{ page()!.page }} / {{ page()!.totalPages }}</span></li>
            <li class="page-item" [class.disabled]="!page()!.hasNext">
              <button class="page-link" (click)="loadPage(page()!.page + 1)"><i class="bi bi-chevron-right"></i></button>
            </li>
          </ul>
        </nav>
      }
    }
  </div>
</div>
  `
})
export class AccountOrdersComponent {
  private orders = inject(OrderService);

  page = signal<PagedResult<OrderList> | null>(null);
  loading = signal(true);

  constructor() { this.loadPage(1); }

  loadPage(p: number): void {
    this.loading.set(true);
    this.orders.listMine(p, 10).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => { this.page.set(null); this.loading.set(false); }
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
