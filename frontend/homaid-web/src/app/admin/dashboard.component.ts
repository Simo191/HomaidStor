import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js/auto';
import { PagedResult } from '../core/models/api.models';
import { ProductListItem } from '../core/models/catalog.models';
import { OrderList } from '../core/models/order.models';
import { ApiService } from '../core/services/api.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';
import { ChartCanvasComponent } from './shared/chart-canvas.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, ChartCanvasComponent],
  template: `
<!-- Page header -->
<div class="page-header">
  <div>
    <h1>Tableau de bord</h1>
    <p class="page-sub">Vue d'ensemble de votre activité Velisse</p>
  </div>
  <div class="header-tabs">
    <button class="tab-btn" [class.active]="range() === 7" (click)="setRange(7)">7 jours</button>
    <button class="tab-btn" [class.active]="range() === 14" (click)="setRange(14)">14 jours</button>
    <button class="tab-btn" [class.active]="range() === 30" (click)="setRange(30)">30 jours</button>
  </div>
</div>

<!-- KPIs -->
<div class="row g-3 mb-4">
  <div class="col-6 col-md-3">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#FCE4E0; color:#B88577">
        <i class="bi bi-receipt"></i>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Commandes</div>
        <div class="kpi-value">{{ totalOrders() }}</div>
        <div class="kpi-trend" [class.up]="orderTrend() > 0" [class.down]="orderTrend() < 0">
          <i class="bi" [class.bi-arrow-up-right]="orderTrend() >= 0" [class.bi-arrow-down-right]="orderTrend() < 0"></i>
          <span>{{ orderTrend() > 0 ? '+' : '' }}{{ orderTrend() }}%</span>
          <small>vs période préc.</small>
        </div>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#E5F0E2; color:#6B8E5A">
        <i class="bi bi-currency-exchange"></i>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Revenu</div>
        <div class="kpi-value">{{ totalRevenue() | money:'MAD' }}</div>
        <div class="kpi-trend up">
          <i class="bi bi-cash-stack"></i>
          <span>Moy. {{ averageOrder() | money:'MAD' }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#FFF4E0; color:#D49A5C">
        <i class="bi bi-clock-history"></i>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">En attente</div>
        <div class="kpi-value">{{ pendingOrders() }}</div>
        <div class="kpi-trend">
          <i class="bi bi-hourglass-split"></i>
          <span>À traiter</span>
        </div>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:#FBE4E4; color:#C04B3F">
        <i class="bi bi-exclamation-triangle"></i>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Stock bas</div>
        <div class="kpi-value">{{ lowStockCount() }}</div>
        <div class="kpi-trend">
          <i class="bi bi-box-seam"></i>
          <span>Produits ≤ 5</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Charts row 1 : Revenue line + Status doughnut -->
<div class="row g-3 mb-4">
  <div class="col-12 col-lg-8">
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h6>Revenu &amp; Commandes</h6>
          <small>Évolution des {{ range() }} derniers jours</small>
        </div>
        <div class="chart-legend">
          <span class="legend-dot" style="background:#B88577"></span> Revenu (MAD)
          <span class="legend-dot ms-3" style="background:#3D2817"></span> Nb commandes
        </div>
      </div>
      <div class="chart-canvas-wrap" style="height:280px">
        <app-chart-canvas type="line" [data]="revenueChartData()" [options]="revenueChartOpts"></app-chart-canvas>
      </div>
    </div>
  </div>
  <div class="col-12 col-lg-4">
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h6>Statuts des commandes</h6>
          <small>Répartition actuelle</small>
        </div>
      </div>
      <div class="chart-canvas-wrap" style="height:280px">
        <app-chart-canvas type="doughnut" [data]="statusChartData()" [options]="statusChartOpts"></app-chart-canvas>
      </div>
    </div>
  </div>
</div>

<!-- Charts row 2 : Daily bar + Payment doughnut -->
<div class="row g-3 mb-4">
  <div class="col-12 col-lg-8">
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h6>Commandes par jour</h6>
          <small>Volume sur la période</small>
        </div>
      </div>
      <div class="chart-canvas-wrap" style="height:240px">
        <app-chart-canvas type="bar" [data]="ordersBarData()" [options]="ordersBarOpts"></app-chart-canvas>
      </div>
    </div>
  </div>
  <div class="col-12 col-lg-4">
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h6>Modes de paiement</h6>
          <small>COD vs Virement</small>
        </div>
      </div>
      <div class="chart-canvas-wrap" style="height:240px">
        <app-chart-canvas type="pie" [data]="paymentChartData()" [options]="paymentChartOpts"></app-chart-canvas>
      </div>
    </div>
  </div>
</div>

<!-- Tables row -->
<div class="row g-3">
  <div class="col-12 col-lg-7">
    <div class="table-card">
      <div class="table-card-header">
        <div>
          <h6>Dernières commandes</h6>
          <small>{{ recentOrders().length }} affichées</small>
        </div>
        <a routerLink="/admin/orders" class="btn-link-velisse">Tout voir <i class="bi bi-arrow-right"></i></a>
      </div>
      @if (loading()) {
        <div class="text-center p-4"><div class="spinner-border" style="color:var(--admin-accent)"></div></div>
      } @else if (recentOrders().length === 0) {
        <div class="empty">Aucune commande</div>
      } @else {
        <table class="table mb-0">
          <thead><tr><th>N°</th><th>Client</th><th>Total</th><th>Statut</th></tr></thead>
          <tbody>
            @for (o of recentOrders(); track o.id) {
              <tr>
                <td><a [routerLink]="['/admin/orders', o.id]" class="order-link">{{ o.orderNumber }}</a></td>
                <td>{{ o.customerName }}<br><small style="color:var(--admin-text-muted)">{{ o.createdAt | date:'short' }}</small></td>
                <td><strong>{{ o.total | money:o.currency }}</strong></td>
                <td><span class="status-pill" [ngClass]="statusClass(o.status)">{{ o.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  </div>

  <div class="col-12 col-lg-5">
    <div class="table-card">
      <div class="table-card-header">
        <div>
          <h6><i class="bi bi-exclamation-triangle text-warning me-1"></i>Stock bas</h6>
          <small>{{ lowStockProducts().length }} produits</small>
        </div>
        <a routerLink="/admin/products" class="btn-link-velisse">Gérer <i class="bi bi-arrow-right"></i></a>
      </div>
      @if (lowStockProducts().length === 0) {
        <div class="empty">Tout est en stock suffisant ✓</div>
      } @else {
        <ul class="stock-list">
          @for (p of lowStockProducts(); track p.id) {
            <li>
              <div class="stock-info">
                <strong>{{ p.name }}</strong>
                <small>{{ p.sku }}</small>
              </div>
              <span class="stock-badge" [class.stock-critical]="p.stockQuantity === 0">
                {{ p.stockQuantity }} restants
              </span>
            </li>
          }
        </ul>
      }
    </div>
  </div>
</div>
  `,
  styles: [`
    :host {
      display: block;
      --admin-accent: #B88577;
      --admin-accent-soft: #FBE9E5;
      --admin-text: #3D2817;
      --admin-text-muted: #8B7068;
      --admin-border: #EDE4DE;
      --admin-card-bg: #FFFFFF;
    }

    /* Page header */
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

    .header-tabs {
      display: inline-flex;
      background: #fff;
      border: 1px solid var(--admin-border);
      border-radius: 8px;
      padding: 4px;
    }
    .tab-btn {
      border: none; background: transparent;
      padding: .4rem .85rem; border-radius: 6px;
      font-size: .82rem; color: var(--admin-text-muted);
      font-weight: 500; cursor: pointer; transition: all .15s;
    }
    .tab-btn:hover { color: var(--admin-text); }
    .tab-btn.active {
      background: var(--admin-accent);
      color: #fff;
    }

    /* KPI cards */
    .kpi-card {
      background: var(--admin-card-bg);
      border: 1px solid var(--admin-border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex; gap: 1rem; align-items: flex-start;
      height: 100%;
      transition: all .15s;
    }
    .kpi-card:hover {
      border-color: var(--admin-accent);
      box-shadow: 0 4px 12px rgba(184,133,119,.08);
    }
    .kpi-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    .kpi-body { flex-grow: 1; min-width: 0; }
    .kpi-label {
      font-size: .75rem; text-transform: uppercase;
      letter-spacing: .1em; color: var(--admin-text-muted);
      font-weight: 500; margin-bottom: .25rem;
    }
    .kpi-value {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.75rem; font-weight: 600;
      color: var(--admin-text); line-height: 1.1;
    }
    .kpi-trend {
      margin-top: .4rem;
      font-size: .75rem;
      color: var(--admin-text-muted);
      display: inline-flex; align-items: center; gap: .25rem;
    }
    .kpi-trend.up { color: #6B8E5A; }
    .kpi-trend.down { color: #C04B3F; }
    .kpi-trend small { color: var(--admin-text-muted); margin-left: .25rem; }

    /* Chart card */
    .chart-card {
      background: var(--admin-card-bg);
      border: 1px solid var(--admin-border);
      border-radius: 12px;
      padding: 1.25rem;
      height: 100%;
    }
    .chart-header {
      display: flex; justify-content: space-between;
      align-items: start; gap: 1rem; flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .chart-header h6 {
      font-family: 'Poppins'; font-weight: 600;
      margin: 0; color: var(--admin-text); font-size: 1rem;
    }
    .chart-header small { color: var(--admin-text-muted); font-size: .8rem; }
    .chart-legend { font-size: .75rem; color: var(--admin-text-muted); }
    .legend-dot {
      display: inline-block; width: 10px; height: 10px;
      border-radius: 50%; margin-right: .35rem;
    }
    .chart-canvas-wrap { position: relative; }

    /* Table card */
    .table-card {
      background: var(--admin-card-bg);
      border: 1px solid var(--admin-border);
      border-radius: 12px;
      overflow: hidden;
      height: 100%;
    }
    .table-card-header {
      padding: 1rem 1.25rem;
      display: flex; justify-content: space-between;
      align-items: center; gap: 1rem;
      border-bottom: 1px solid var(--admin-border);
    }
    .table-card-header h6 {
      font-family: 'Poppins'; font-weight: 600; margin: 0;
      color: var(--admin-text); font-size: 1rem;
    }
    .table-card-header small { color: var(--admin-text-muted); font-size: .78rem; }
    .table-card .table { margin: 0; }
    .table-card .table th {
      background: #FAF7F4;
      color: var(--admin-text-muted);
      font-weight: 500; font-size: .75rem;
      text-transform: uppercase; letter-spacing: .08em;
      padding: .65rem 1.25rem; border-bottom: 1px solid var(--admin-border);
    }
    .table-card .table td {
      padding: .85rem 1.25rem; border-bottom: 1px solid var(--admin-border);
      vertical-align: middle;
    }
    .table-card .table tr:last-child td { border-bottom: none; }
    .order-link {
      color: var(--admin-accent); text-decoration: none;
      font-family: monospace; font-size: .85rem;
    }
    .order-link:hover { text-decoration: underline; }

    .btn-link-velisse {
      color: var(--admin-accent); text-decoration: none;
      font-size: .82rem; font-weight: 500;
    }
    .btn-link-velisse:hover { color: #9C6E60; }

    /* Status pill */
    .status-pill {
      display: inline-block;
      padding: .25rem .6rem;
      border-radius: 12px;
      font-size: .72rem;
      font-weight: 500;
      letter-spacing: .03em;
    }
    .pill-pending { background: #FFF4E0; color: #8a5e1a; }
    .pill-confirmed { background: #E0EFFE; color: #1a5e8a; }
    .pill-preparing { background: #FCE4E0; color: #8a3e1a; }
    .pill-shipped { background: #E0EFFE; color: #1a5e8a; }
    .pill-delivered { background: #E5F0E2; color: #2e5e2a; }
    .pill-cancelled { background: #EAEAEA; color: #555; }

    /* Stock list */
    .stock-list { list-style: none; padding: 0; margin: 0; }
    .stock-list li {
      padding: .85rem 1.25rem;
      display: flex; justify-content: space-between;
      align-items: center; gap: 1rem;
      border-bottom: 1px solid var(--admin-border);
    }
    .stock-list li:last-child { border-bottom: none; }
    .stock-info { display: flex; flex-direction: column; min-width: 0; }
    .stock-info strong {
      color: var(--admin-text); font-size: .9rem;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .stock-info small {
      color: var(--admin-text-muted); font-size: .72rem;
      font-family: monospace;
    }
    .stock-badge {
      background: #FFF4E0; color: #8a5e1a;
      padding: .25rem .7rem; border-radius: 12px;
      font-size: .75rem; font-weight: 500;
      flex-shrink: 0;
    }
    .stock-badge.stock-critical { background: #FBE4E4; color: #c04b3f; }

    .empty {
      padding: 2rem;
      text-align: center;
      color: var(--admin-text-muted);
      font-size: .9rem;
    }
  `]
})
export class DashboardComponent {
  private api = inject(ApiService);

  orders = signal<OrderList[]>([]);
  products = signal<ProductListItem[]>([]);
  loading = signal(true);
  range = signal(14);

  // ============ KPIs ============
  totalOrders = computed(() => this.ordersInRange().length);
  totalRevenue = computed(() => this.ordersInRange()
    .filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded')
    .reduce((s, o) => s + o.total, 0));
  pendingOrders = computed(() => this.orders().filter(o => o.status === 'Pending').length);
  averageOrder = computed(() => {
    const valid = this.ordersInRange().filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded');
    if (valid.length === 0) return 0;
    return valid.reduce((s, o) => s + o.total, 0) / valid.length;
  });

  orderTrend = computed(() => {
    const days = this.range();
    const now = Date.now();
    const cur = this.orders().filter(o => (now - new Date(o.createdAt).getTime()) < days * 86400000).length;
    const prev = this.orders().filter(o => {
      const age = now - new Date(o.createdAt).getTime();
      return age >= days * 86400000 && age < days * 2 * 86400000;
    }).length;
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(100 * (cur - prev) / prev);
  });

  ordersInRange = computed(() => {
    const days = this.range();
    const cutoff = Date.now() - days * 86400000;
    return this.orders().filter(o => new Date(o.createdAt).getTime() >= cutoff);
  });

  recentOrders = computed(() => this.orders().slice(0, 6));

  lowStockProducts = computed(() => this.products()
    .filter(p => p.stockQuantity <= 5)
    .slice(0, 8));
  lowStockCount = computed(() => this.products().filter(p => p.stockQuantity <= 5).length);

  // ============ CHARTS ============

  /** Revenue + orders dual axis line chart */
  revenueChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const days = this.range();
    const labels: string[] = [];
    const revenue: number[] = [];
    const counts: number[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      labels.push(dayKey);

      const dayOrders = this.orders().filter(o => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === d.getFullYear()
          && od.getMonth() === d.getMonth()
          && od.getDate() === d.getDate()
          && o.status !== 'Cancelled' && o.status !== 'Refunded';
      });
      revenue.push(dayOrders.reduce((s, o) => s + o.total, 0));
      counts.push(dayOrders.length);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Revenu',
          data: revenue,
          borderColor: '#B88577',
          backgroundColor: 'rgba(184, 133, 119, .12)',
          fill: true,
          tension: .35,
          pointRadius: 3,
          pointBackgroundColor: '#B88577',
          yAxisID: 'y'
        },
        {
          label: 'Nb commandes',
          data: counts,
          borderColor: '#3D2817',
          backgroundColor: 'rgba(61, 40, 23, .04)',
          borderDash: [5, 4],
          fill: false,
          tension: .35,
          pointRadius: 3,
          pointBackgroundColor: '#3D2817',
          yAxisID: 'y1'
        }
      ]
    };
  });

  revenueChartOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      y: {
        position: 'left',
        grid: { color: '#F0DDD7' },
        ticks: { color: '#8B7068', callback: (v) => `${v} DH` }
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#8B7068', stepSize: 1 }
      },
      x: { grid: { display: false }, ticks: { color: '#8B7068' } }
    }
  };

  /** Status doughnut */
  statusChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const map: Record<string, number> = {};
    for (const o of this.orders()) map[o.status] = (map[o.status] ?? 0) + 1;
    const labels = Object.keys(map);
    return {
      labels,
      datasets: [{
        data: labels.map(k => map[k]),
        backgroundColor: ['#D49A5C', '#0288D1', '#B88577', '#6B8E5A', '#8B7068', '#C04B3F', '#3D2817'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  });

  statusChartOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } }
    }
  };

  /** Daily orders bar */
  ordersBarData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const days = Math.min(this.range(), 14);
    const labels: string[] = [];
    const counts: number[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      counts.push(this.orders().filter(o => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === d.getFullYear()
          && od.getMonth() === d.getMonth()
          && od.getDate() === d.getDate();
      }).length);
    }
    return {
      labels,
      datasets: [{
        label: 'Commandes',
        data: counts,
        backgroundColor: '#B88577',
        borderRadius: 6,
        borderSkipped: false
      }]
    };
  });

  ordersBarOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#8B7068' }, grid: { color: '#F0DDD7' } },
      x: { grid: { display: false }, ticks: { color: '#8B7068' } }
    }
  };

  /** Payment method pie */
  paymentChartData = computed<ChartConfiguration<'pie'>['data']>(() => {
    const cod = this.orders().filter(o => o.paymentMethod === 'CashOnDelivery').length;
    const bank = this.orders().filter(o => o.paymentMethod === 'BankTransfer').length;
    return {
      labels: ['Paiement à la livraison', 'Virement bancaire'],
      datasets: [{
        data: [cod, bank],
        backgroundColor: ['#B88577', '#3D2817'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  });

  paymentChartOpts: ChartConfiguration<'pie'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } }
    }
  };

  // ============ Lifecycle ============
  constructor() {
    this.api.get<PagedResult<OrderList>>('/admin/orders', { page: 1, pageSize: 200 }).subscribe({
      next: r => { this.orders.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.get<PagedResult<ProductListItem>>('/admin/products', { page: 1, pageSize: 200, includeInactive: false }).subscribe({
      next: r => this.products.set(r.items)
    });
  }

  setRange(d: number) { this.range.set(d); }

  statusClass(s: string): string {
    return ({
      Pending: 'pill-pending', Confirmed: 'pill-confirmed',
      Preparing: 'pill-preparing', Shipped: 'pill-shipped',
      Delivered: 'pill-delivered', Cancelled: 'pill-cancelled',
      Refunded: 'pill-cancelled'
    } as Record<string, string>)[s] || 'pill-pending';
  }
}
