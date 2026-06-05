import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PagedResult } from '../core/models/api.models';
import { OrderList, OrderStatus } from '../core/models/order.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';

interface KanbanColumn {
  status: OrderStatus;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-orders-kanban',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule, MoneyPipe],
  template: `
<div class="page-header">
  <div>
    <h1>Tableau commandes</h1>
    <p class="page-sub">Glissez-déposez une commande pour changer son statut</p>
  </div>
  <div class="d-flex gap-2 align-items-center flex-wrap">
    <a routerLink="/admin/orders" class="view-toggle">
      <i class="bi bi-table"></i> Vue tableau
    </a>
    <a routerLink="/admin/orders/board" class="view-toggle active">
      <i class="bi bi-kanban"></i> Vue kanban
    </a>
  </div>
</div>

@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border" style="color:var(--admin-accent)"></div></div>
} @else {
  <div class="kanban-board">
    @for (col of columns; track col.status) {
      <div class="kanban-column">
        <div class="column-header" [style.border-top-color]="col.color">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="column-icon" [style.background]="col.bg" [style.color]="col.color">
                <i class="bi" [class]="col.icon"></i>
              </span>
              <strong class="ms-2">{{ col.label }}</strong>
            </div>
            <span class="column-count">{{ ordersByStatus()[col.status].length }}</span>
          </div>
          <small class="column-total">
            {{ totalFor(col.status) | money:'MAD' }}
          </small>
        </div>

        <div
          class="column-drop-zone"
          cdkDropList
          [id]="col.status"
          [cdkDropListData]="ordersByStatus()[col.status]"
          [cdkDropListConnectedTo]="connectedTo(col.status)"
          (cdkDropListDropped)="onDrop($event, col.status)">

          @for (o of ordersByStatus()[col.status]; track o.id) {
            <div class="order-card" cdkDrag [cdkDragData]="o">
              <div class="order-card-handle" cdkDragHandle>
                <i class="bi bi-grip-vertical"></i>
              </div>
              <div class="order-card-body">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <a [routerLink]="['/admin/orders', o.id]" class="order-num">{{ o.orderNumber }}</a>
                  <strong style="color:var(--admin-accent)">{{ o.total | money:o.currency }}</strong>
                </div>
                <div class="order-customer text-truncate">
                  <i class="bi bi-person"></i> {{ o.customerName }}
                </div>
                <div class="order-meta">
                  <span><i class="bi bi-bag"></i> {{ o.itemCount }}</span>
                  <span><i class="bi bi-geo-alt"></i> {{ o.shippingCity }} · {{ o.shippingCountryCode }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <small class="text-muted">{{ o.createdAt | date:'short' }}</small>
                  @if (o.paymentMethod === 'CashOnDelivery') {
                    <span class="payment-pill cod"><i class="bi bi-cash"></i> COD</span>
                  } @else {
                    <span class="payment-pill bank"><i class="bi bi-bank"></i> Virement</span>
                  }
                </div>
              </div>
            </div>
          }

          @if (ordersByStatus()[col.status].length === 0) {
            <div class="empty-column">
              <i class="bi bi-inbox" style="font-size:2rem; opacity:.4"></i>
              <small>Aucune commande</small>
            </div>
          }
        </div>
      </div>
    }
  </div>
}
  `,
  styles: [`
    :host {
      display: block;
      --admin-accent: #B88577;
      --admin-text: #3D2817;
      --admin-text-muted: #8B7068;
      --admin-border: #EDE4DE;
    }

    .page-header {
      display: flex; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; align-items: end;
      margin-bottom: 1.5rem;
    }
    .page-header h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.85rem; font-weight: 600;
      margin: 0; color: var(--admin-text);
    }
    .page-sub { color: var(--admin-text-muted); font-size: .9rem; margin: 0; }

    .view-toggle {
      padding: .55rem 1rem;
      border-radius: 8px;
      font-size: .85rem;
      color: var(--admin-text-muted);
      background: #fff;
      border: 1px solid var(--admin-border);
      text-decoration: none;
      transition: all .15s;
    }
    .view-toggle:hover { color: var(--admin-text); }
    .view-toggle.active {
      background: var(--admin-accent);
      color: #fff;
      border-color: var(--admin-accent);
    }

    /* Kanban board (horizontal scroll on small) */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(5, minmax(260px, 1fr));
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 1rem;
    }
    @media (max-width: 1199.98px) {
      .kanban-board { grid-template-columns: repeat(5, 280px); }
    }

    .kanban-column {
      background: #FAF7F4;
      border-radius: 12px;
      display: flex; flex-direction: column;
      min-height: 600px;
      max-height: calc(100vh - 220px);
    }
    .column-header {
      padding: 1rem;
      border-top: 3px solid #B88577;
      border-radius: 12px 12px 0 0;
      background: #fff;
      border-bottom: 1px solid var(--admin-border);
    }
    .column-icon {
      width: 28px; height: 28px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%; font-size: .85rem;
    }
    .column-count {
      background: #fff;
      border: 1px solid var(--admin-border);
      padding: .15em .55em; border-radius: 999px;
      font-size: .8rem; font-weight: 600;
      color: var(--admin-text);
    }
    .column-total {
      color: var(--admin-accent); font-weight: 600;
      display: block; margin-top: .35rem;
    }

    /* Drop zone */
    .column-drop-zone {
      flex-grow: 1; overflow-y: auto;
      padding: .75rem;
      display: flex; flex-direction: column; gap: .65rem;
      min-height: 100px;
    }
    .column-drop-zone.cdk-drop-list-dragging .order-card:not(.cdk-drag-placeholder) {
      transition: transform .2s cubic-bezier(0,0,.2,1);
    }

    /* Order card */
    .order-card {
      background: #fff;
      border: 1px solid var(--admin-border);
      border-radius: 10px;
      padding: .65rem .75rem .75rem;
      cursor: grab;
      transition: all .15s;
      display: flex;
      gap: .4rem;
    }
    .order-card:hover {
      border-color: var(--admin-accent);
      box-shadow: 0 4px 12px rgba(184,133,119,.1);
    }
    .order-card:active { cursor: grabbing; }
    .order-card.cdk-drag-preview {
      box-shadow: 0 8px 24px rgba(61,40,23,.18);
      transform: rotate(2deg);
    }
    .order-card.cdk-drag-placeholder {
      opacity: .35;
      background: var(--admin-accent);
      border-color: transparent;
    }
    .order-card.cdk-drag-placeholder * { visibility: hidden; }

    .order-card-handle {
      color: var(--admin-text-muted);
      cursor: grab;
      align-self: center;
      flex-shrink: 0;
    }
    .order-card-body { flex-grow: 1; min-width: 0; }
    .order-num {
      color: var(--admin-accent);
      font-family: monospace; font-size: .82rem;
      font-weight: 600; text-decoration: none;
    }
    .order-num:hover { text-decoration: underline; }
    .order-customer {
      color: var(--admin-text);
      font-size: .85rem; font-weight: 500;
      margin-bottom: .15rem;
    }
    .order-customer i {
      color: var(--admin-text-muted); margin-right: .2rem;
    }
    .order-meta {
      display: flex; gap: .75rem; font-size: .72rem;
      color: var(--admin-text-muted);
      flex-wrap: wrap;
    }
    .order-meta i { margin-right: .15em; }

    .payment-pill {
      font-size: .65rem;
      padding: .12em .5em;
      border-radius: 999px;
      letter-spacing: .04em;
    }
    .payment-pill.cod { background: #FCE4E0; color: #8a3e1a; }
    .payment-pill.bank { background: #E0EFFE; color: #1a5e8a; }

    .empty-column {
      flex-grow: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: .5rem; color: var(--admin-text-muted);
      padding: 2rem 1rem; text-align: center;
    }
  `]
})
export class OrdersKanbanComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  orders = signal<OrderList[]>([]);

  readonly columns: KanbanColumn[] = [
    { status: 'Pending',   label: 'En attente', icon: 'bi-clock-history',  color: '#D49A5C', bg: '#FFF4E0' },
    { status: 'Confirmed', label: 'Confirmées', icon: 'bi-check-circle',   color: '#0288D1', bg: '#E0EFFE' },
    { status: 'Preparing', label: 'Préparation',icon: 'bi-box-seam',       color: '#B88577', bg: '#FCE4E0' },
    { status: 'Shipped',   label: 'Expédiées',  icon: 'bi-truck',          color: '#0288D1', bg: '#E0EFFE' },
    { status: 'Delivered', label: 'Livrées',    icon: 'bi-check2-square',  color: '#6B8E5A', bg: '#E5F0E2' }
  ];

  ordersByStatus = computed(() => {
    const map: Record<OrderStatus, OrderList[]> = {
      Pending: [], Confirmed: [], Preparing: [], Shipped: [], Delivered: [],
      Cancelled: [], Refunded: []
    };
    for (const o of this.orders()) map[o.status]?.push(o);
    return map;
  });

  connectedTo(current: OrderStatus): string[] {
    // Toutes les autres colonnes acceptent le drop (le backend rejette si transition invalide)
    return this.columns.filter(c => c.status !== current).map(c => c.status);
  }

  totalFor(status: OrderStatus): number {
    return this.ordersByStatus()[status].reduce((s, o) => s + o.total, 0);
  }

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PagedResult<OrderList>>('/admin/orders', { page: 1, pageSize: 200 }).subscribe({
      next: r => { this.orders.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onDrop(event: CdkDragDrop<OrderList[]>, targetStatus: OrderStatus) {
    if (event.previousContainer === event.container) return;
    const order = event.item.data as OrderList;
    const fromStatus = order.status;

    // Optimistic update : déplace localement
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.orders.update(list => list.map(o => o.id === order.id ? { ...o, status: targetStatus } : o));

    // Appel API
    this.api.patch(`/admin/orders/${order.id}/status`, { status: targetStatus, notes: null }).subscribe({
      next: () => this.toast.success(`Commande ${order.orderNumber} : ${fromStatus} → ${targetStatus}`),
      error: (e: ApiException) => {
        // Rollback
        this.toast.error(e.message ?? 'Transition refusée');
        this.load();
      }
    });
  }
}
