import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PagedResult } from '../core/models/api.models';
import { ProductListItem } from '../core/models/catalog.models';
import { OrderList } from '../core/models/order.models';
import { ApiService } from '../core/services/api.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
<h1 class="h3 mb-4">Tableau de bord</h1>

<div class="row g-3 mb-4">
  <div class="col-md-3">
    <div class="card text-bg-primary">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <div>
            <div class="small">Commandes totales</div>
            <h3 class="mb-0">{{ totalOrders() }}</h3>
          </div>
          <i class="bi bi-receipt display-5 opacity-50"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card text-bg-success">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <div>
            <div class="small">Revenu total</div>
            <h3 class="mb-0">{{ totalRevenue() | money:'MAD' }}</h3>
          </div>
          <i class="bi bi-cash-stack display-5 opacity-50"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card text-bg-warning">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <div>
            <div class="small">En attente</div>
            <h3 class="mb-0">{{ pendingOrders() }}</h3>
          </div>
          <i class="bi bi-clock-history display-5 opacity-50"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card text-bg-danger">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <div>
            <div class="small">Stock bas</div>
            <h3 class="mb-0">{{ lowStockCount() }}</h3>
          </div>
          <i class="bi bi-exclamation-triangle display-5 opacity-50"></i>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="row g-3">
  <div class="col-md-7">
    <div class="card">
      <div class="card-header d-flex justify-content-between">
        <strong>Dernières commandes</strong>
        <a routerLink="/admin/orders" class="btn btn-sm btn-link">Tout voir</a>
      </div>
      <div class="card-body p-0">
        @if (loading()) {
          <div class="text-center p-4"><div class="spinner-border text-primary"></div></div>
        } @else if (recentOrders().length === 0) {
          <div class="text-center p-4 text-muted">Aucune commande pour l'instant.</div>
        } @else {
          <table class="table table-hover mb-0">
            <thead><tr>
              <th>N°</th><th>Client</th><th>Total</th><th>Statut</th><th></th>
            </tr></thead>
            <tbody>
              @for (o of recentOrders(); track o.id) {
                <tr>
                  <td><code>{{ o.orderNumber }}</code></td>
                  <td>{{ o.customerName }}<br><small class="text-muted">{{ o.createdAt | date:'short' }}</small></td>
                  <td><strong>{{ o.total | money:o.currency }}</strong></td>
                  <td><span class="badge" [ngClass]="statusClass(o.status)">{{ o.status }}</span></td>
                  <td><a [routerLink]="['/admin/orders', o.id]" class="btn btn-sm btn-outline-primary">Voir</a></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  </div>

  <div class="col-md-5">
    <div class="card">
      <div class="card-header d-flex justify-content-between">
        <strong><i class="bi bi-exclamation-triangle text-warning"></i> Stock bas</strong>
        <a routerLink="/admin/products" class="btn btn-sm btn-link">Gérer</a>
      </div>
      <div class="card-body p-0">
        @if (lowStockProducts().length === 0) {
          <div class="text-center p-4 text-muted">Tous les produits sont en stock suffisant.</div>
        } @else {
          <ul class="list-group list-group-flush">
            @for (p of lowStockProducts(); track p.id) {
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{{ p.name }}</strong><br>
                  <small class="text-muted">{{ p.sku }}</small>
                </div>
                <span class="badge bg-warning text-dark">{{ p.stockQuantity }} restants</span>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  </div>
</div>
  `
})
export class DashboardComponent {
  private api = inject(ApiService);

  orders = signal<OrderList[]>([]);
  products = signal<ProductListItem[]>([]);
  loading = signal(true);

  totalOrders = computed(() => this.orders().length);
  totalRevenue = computed(() => this.orders()
    .filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded')
    .reduce((sum, o) => sum + o.total, 0));
  pendingOrders = computed(() => this.orders().filter(o => o.status === 'Pending').length);
  recentOrders = computed(() => this.orders().slice(0, 8));

  lowStockProducts = computed(() => this.products()
    .filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5)
    .slice(0, 10));
  lowStockCount = computed(() => this.lowStockProducts().length);

  constructor() {
    this.api.get<PagedResult<OrderList>>('/admin/orders', { page: 1, pageSize: 100 }).subscribe({
      next: r => { this.orders.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.get<PagedResult<ProductListItem>>('/admin/products', { page: 1, pageSize: 200, includeInactive: false }).subscribe({
      next: r => this.products.set(r.items)
    });
  }

  statusClass(s: string): string {
    return ({
      Pending: 'bg-warning text-dark', Confirmed: 'bg-info', Preparing: 'bg-primary',
      Shipped: 'bg-info', Delivered: 'bg-success', Cancelled: 'bg-secondary', Refunded: 'bg-secondary'
    } as Record<string, string>)[s] || 'bg-secondary';
  }
}
