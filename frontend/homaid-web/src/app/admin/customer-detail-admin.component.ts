import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminCustomerDetail } from '../core/models/admin-customer.models';
import { PagedResult } from '../core/models/api.models';
import { OrderList } from '../core/models/order.models';
import { ApiService } from '../core/services/api.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';
import { OrderStatusLabelPipe, PaymentMethodLabelPipe } from '../shared/pipes/order-labels.pipes';

@Component({
  selector: 'app-customer-detail-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, OrderStatusLabelPipe, PaymentMethodLabelPipe],
  template: `
@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border" style="color:var(--velisse-rose-gold)"></div></div>
} @else if (!customer()) {
  <div class="alert" style="background:#FCE4E4; border:1px solid #F0C0BD; color:#9C3530">
    <i class="bi bi-exclamation-triangle me-2"></i>Client introuvable.
    <a routerLink="/admin/customers" class="alert-link">Retour à la liste</a>
  </div>
} @else {
<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
  <h1 class="page-title">
    <span class="avatar avatar-lg">{{ initials() }}</span>
    {{ customer()!.firstName }} {{ customer()!.lastName }}
    @if (customer()!.isActive) {
      <span class="status-pill pill-active ms-2">Actif</span>
    } @else {
      <span class="status-pill pill-inactive ms-2">Désactivé</span>
    }
  </h1>
  <a routerLink="/admin/customers" class="btn btn-outline-secondary btn-sm">
    <i class="bi bi-arrow-left"></i> Retour
  </a>
</div>

<!-- KPIs -->
<div class="row g-3 mb-3">
  <div class="col-md-4">
    <div class="mini-kpi">
      <div class="kpi-icon" style="background:#FBE9E5; color:#B88577"><i class="bi bi-receipt"></i></div>
      <div>
        <small>Commandes</small>
        <strong>{{ customer()!.orderCount }}</strong>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="mini-kpi">
      <div class="kpi-icon" style="background:#E5F0E2; color:#6B8E5A"><i class="bi bi-currency-exchange"></i></div>
      <div>
        <small>Total dépensé</small>
        <strong>{{ customer()!.totalSpent | money:'MAD' }}</strong>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="mini-kpi">
      <div class="kpi-icon" style="background:#FFF4E0; color:#D49A5C"><i class="bi bi-calendar-event"></i></div>
      <div>
        <small>Membre depuis</small>
        <strong>{{ customer()!.createdAt | date:'mediumDate' }}</strong>
      </div>
    </div>
  </div>
</div>

<div class="row g-3">
  <!-- Identité + contact + adresses -->
  <div class="col-lg-4">
    <div class="info-card mb-3">
      <h6 class="card-title">Identité</h6>
      <dl class="info-list">
        <dt>Email</dt><dd><a [href]="'mailto:' + customer()!.email">{{ customer()!.email }}</a>
          @if (customer()!.emailVerified) { <i class="bi bi-patch-check-fill text-success ms-1" title="Email vérifié"></i> }
        </dd>
        <dt>Téléphone</dt><dd><a [href]="'tel:' + customer()!.phone">{{ customer()!.phone }}</a>
          @if (customer()!.phoneVerified) { <i class="bi bi-patch-check-fill text-success ms-1"></i> }
        </dd>
        <dt>Connexion via</dt><dd>{{ providerLabel(customer()!.authProvider) }}</dd>
        <dt>Langue</dt><dd>{{ languageLabel(customer()!.preferredLanguage) }}</dd>
        @if (customer()!.lastLoginAt) {
          <dt>Dernière connexion</dt><dd>{{ customer()!.lastLoginAt | date:'short' }}</dd>
        }
      </dl>
    </div>

    <div class="info-card">
      <h6 class="card-title">Carnet d'adresses ({{ customer()!.addresses.length }})</h6>
      @if (customer()!.addresses.length === 0) {
        <p class="text-muted small mb-0"><em>Aucune adresse enregistrée</em></p>
      } @else {
        <div class="address-list">
          @for (a of customer()!.addresses; track a.id) {
            <div class="address-tile" [class.is-default]="a.isDefault">
              @if (a.isDefault) {
                <span class="default-badge">Par défaut</span>
              }
              <strong>{{ a.fullName }}</strong>
              <div class="small">{{ a.street }}
                @if (a.streetComplement) { <br>{{ a.streetComplement }} }
              </div>
              <div class="small">{{ a.city }}@if (a.postalCode) { , {{ a.postalCode }} } · {{ a.countryCode }}</div>
              <div class="small text-muted"><i class="bi bi-telephone"></i> {{ a.phone }}</div>
            </div>
          }
        </div>
      }
    </div>
  </div>

  <!-- Commandes -->
  <div class="col-lg-8">
    <div class="info-card">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="card-title mb-0">Historique des commandes</h6>
        @if (orders()) {
          <small class="text-muted">{{ orders()!.totalCount }} commande(s)</small>
        }
      </div>

      @if (loadingOrders()) {
        <div class="text-center p-3"><div class="spinner-border spinner-border-sm" style="color:#B88577"></div></div>
      } @else if (!orders() || orders()!.items.length === 0) {
        <p class="text-muted small mb-0"><em>Aucune commande pour le moment</em></p>
      } @else {
        <table class="table table-sm">
          <thead>
            <tr><th>N°</th><th>Date</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            @for (o of orders()!.items; track o.id) {
              <tr>
                <td><a [routerLink]="['/admin/orders', o.id]" class="order-link">{{ o.orderNumber }}</a></td>
                <td><small>{{ o.createdAt | date:'short' }}</small></td>
                <td>{{ o.itemCount }}</td>
                <td><strong>{{ o.total | money:o.currency }}</strong></td>
                <td><small>{{ o.paymentMethod | paymentMethodLabel:true }}</small></td>
                <td><span class="status-pill" [ngClass]="statusClass(o.status)">{{ o.status | orderStatusLabel }}</span></td>
                <td>
                  <a [routerLink]="['/admin/orders', o.id]" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-eye"></i>
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (orders()!.totalPages > 1) {
          <div class="pagination-wrap">
            <button class="btn btn-sm btn-outline-secondary" [disabled]="!orders()!.hasPrevious" (click)="loadOrders(orders()!.page - 1)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="small">Page {{ orders()!.page }} / {{ orders()!.totalPages }}</span>
            <button class="btn btn-sm btn-outline-secondary" [disabled]="!orders()!.hasNext" (click)="loadOrders(orders()!.page + 1)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        }
      }
    </div>
  </div>
</div>
}
  `,
  styles: [`
    .page-title { font-family:'Playfair Display'; font-size:1.5rem; font-weight:600; display:flex; align-items:center; gap:.75rem; margin:0; color:var(--velisse-brown); }
    .avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #B88577, #9C6E60); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-weight:600; font-size:.85rem; }
    .avatar-lg { width:46px; height:46px; font-size:1rem; }

    .mini-kpi { background:#fff; border:1px solid #EDE4DE; border-radius:12px; padding:1rem; display:flex; gap:.85rem; align-items:center; }
    .mini-kpi small { color:#8B7068; font-size:.75rem; text-transform:uppercase; letter-spacing:.08em; display:block; margin-bottom:.1rem; }
    .mini-kpi strong { font-family:'Playfair Display'; font-size:1.3rem; color:var(--velisse-brown); }
    .kpi-icon { width:42px; height:42px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; font-size:1.15rem; }

    .info-card { background:#fff; border:1px solid #EDE4DE; border-radius:12px; padding:1.25rem; }
    .card-title { font-family:'Poppins'; font-weight:600; color:var(--velisse-brown); text-transform:uppercase; font-size:.78rem; letter-spacing:.12em; margin-bottom:1rem; }

    .info-list { margin:0; }
    .info-list dt { color:#8B7068; font-weight:500; font-size:.78rem; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.15rem; }
    .info-list dd { font-size:.9rem; margin-bottom:.85rem; word-break:break-all; }
    .info-list dd a { color:var(--velisse-brown); }

    .address-list { display:grid; gap:.65rem; }
    .address-tile {
      position:relative;
      padding:.85rem; border:1px solid #EDE4DE; border-radius:8px;
      background:#FAF7F4; font-size:.85rem;
    }
    .address-tile.is-default { border-color:#B88577; background:#FDF7F4; }
    .default-badge { position:absolute; top:.5rem; right:.5rem; background:#B88577; color:#fff; font-size:.65rem; padding:.15rem .5rem; border-radius:8px; }

    /* Status pills now come from global styles.scss */

    .order-link { color:#B88577; font-family:monospace; text-decoration:none; }
    .order-link:hover { text-decoration:underline; }

    .pagination-wrap { display:flex; gap:.5rem; align-items:center; justify-content:center; padding-top:1rem; }
  `]
})
export class CustomerDetailAdminComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  customer = signal<AdminCustomerDetail | null>(null);
  orders = signal<PagedResult<OrderList> | null>(null);
  loading = signal(true);
  loadingOrders = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.get<AdminCustomerDetail>(`/admin/customers/${id}`).subscribe({
      next: c => { this.customer.set(c); this.loading.set(false); this.loadOrders(1); },
      error: () => { this.customer.set(null); this.loading.set(false); }
    });
  }

  loadOrders(p: number) {
    if (!this.customer()) return;
    this.loadingOrders.set(true);
    this.api.get<PagedResult<OrderList>>(`/admin/customers/${this.customer()!.id}/orders`,
      { page: p, pageSize: 10 }).subscribe({
      next: r => { this.orders.set(r); this.loadingOrders.set(false); },
      error: () => this.loadingOrders.set(false)
    });
  }

  initials(): string {
    const c = this.customer()!;
    return `${(c.firstName[0] ?? '').toUpperCase()}${(c.lastName[0] ?? '').toUpperCase()}` || c.email[0].toUpperCase();
  }

  providerLabel(p: string): string {
    return ({ Local: 'Inscription locale', Google: 'Google', Facebook: 'Facebook' } as Record<string, string>)[p] ?? p;
  }
  languageLabel(l: string): string {
    return ({ fr: 'Français', ar: 'العربية', en: 'English' } as Record<string, string>)[l] ?? l;
  }
  statusClass(s: string): string {
    return ({
      Pending: 'pill-pending', Confirmed: 'pill-confirmed', Preparing: 'pill-preparing',
      Shipped: 'pill-shipped', Delivered: 'pill-delivered',
      Cancelled: 'pill-cancelled', Refunded: 'pill-refunded'
    } as Record<string, string>)[s] ?? 'pill-pending';
  }
}
