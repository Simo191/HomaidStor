import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js/auto';
import { DashboardStats } from '../core/models/stats.models';
import { ApiService } from '../core/services/api.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';
import { ChartCanvasComponent } from './shared/chart-canvas.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, ChartCanvasComponent],
  template: `
<div class="page-header">
  <div>
    <h1>Analytics</h1>
    <p class="page-sub">Revenu détaillé par article, catégorie et tendance mensuelle</p>
  </div>
  <div class="header-tabs">
    <button class="tab-btn" [class.active]="range() === 30" (click)="setRange(30)">30 jours</button>
    <button class="tab-btn" [class.active]="range() === 90" (click)="setRange(90)">90 jours</button>
    <button class="tab-btn" [class.active]="range() === 180" (click)="setRange(180)">6 mois</button>
    <button class="tab-btn" [class.active]="range() === 365" (click)="setRange(365)">1 an</button>
  </div>
</div>

@if (loading()) {
  <div class="text-center py-5"><div class="spinner-border" style="color:#B88577"></div></div>
} @else if (!stats()) {
  <div class="alert alert-warning">Aucune donnée disponible.</div>
} @else {

<!-- Revenu mensuel -->
<div class="chart-card mb-3">
  <div class="chart-header">
    <div>
      <h6>Revenu mensuel (12 derniers mois)</h6>
      <small>Total : <strong>{{ totalRevenue() | money:'MAD' }}</strong> · {{ totalOrderCount() }} commandes valides</small>
    </div>
  </div>
  <div class="chart-canvas-wrap" style="height:280px">
    <app-chart-canvas type="bar" [data]="monthlyChart()" [options]="monthlyOpts"></app-chart-canvas>
  </div>
</div>

<div class="row g-3 mb-3">
  <!-- Top produits -->
  <div class="col-lg-7">
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h6><i class="bi bi-star-fill text-warning me-1"></i> Top 8 produits</h6>
          <small>Sur les {{ range() }} derniers jours</small>
        </div>
      </div>
      @if (stats()!.topProducts.length === 0) {
        <p class="text-muted small">Aucune vente sur cette période.</p>
      } @else {
        <div class="chart-canvas-wrap" style="height:340px">
          <app-chart-canvas type="bar" [data]="topProductsChart()" [options]="topProductsOpts"></app-chart-canvas>
        </div>
      }
    </div>
  </div>

  <!-- Top catégories -->
  <div class="col-lg-5">
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h6><i class="bi bi-tags-fill" style="color:#B88577"></i> Revenu par catégorie</h6>
          <small>Top 5 catégories</small>
        </div>
      </div>
      @if (stats()!.topCategories.length === 0) {
        <p class="text-muted small">Aucune donnée.</p>
      } @else {
        <div class="chart-canvas-wrap" style="height:340px">
          <app-chart-canvas type="doughnut" [data]="categoriesChart()" [options]="categoriesOpts"></app-chart-canvas>
        </div>
      }
    </div>
  </div>
</div>

<!-- Tableau détaillé top produits -->
<div class="data-card mb-3">
  <div class="card-header-flex">
    <h6>Détail des produits les plus vendus</h6>
    <a routerLink="/admin/products" class="btn btn-sm btn-link" style="color:#B88577">Gérer les produits</a>
  </div>
  @if (stats()!.topProducts.length === 0) {
    <div class="empty-state">Aucune donnée</div>
  } @else {
    <table class="table mb-0">
      <thead>
        <tr><th>#</th><th>Produit</th><th>SKU</th><th>Quantité</th><th>Revenu</th><th>Part</th></tr>
      </thead>
      <tbody>
        @for (p of stats()!.topProducts; track p.productId; let i = $index) {
          <tr>
            <td class="rank">{{ i + 1 }}</td>
            <td>
              <div class="d-flex gap-2 align-items-center">
                @if (p.imageUrl) {
                  <img [src]="p.imageUrl" style="width:36px; height:36px; object-fit:cover" class="rounded" [alt]="p.name">
                }
                <strong>{{ p.name }}</strong>
              </div>
            </td>
            <td><code style="color:#8B7068; font-size:.8rem">{{ p.sku }}</code></td>
            <td><span class="count-badge">{{ p.quantitySold }}</span></td>
            <td><strong>{{ p.revenue | money:'MAD' }}</strong></td>
            <td>
              <div class="progress" style="height:6px; background:#FBE9E5">
                <div class="progress-bar" [style.width.%]="percent(p.revenue, productsMaxRev())"
                     style="background:#B88577"></div>
              </div>
              <small class="text-muted">{{ percent(p.revenue, totalRevenue()) }}%</small>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>

<!-- Tableau catégories -->
<div class="data-card">
  <div class="card-header-flex">
    <h6>Revenu par catégorie</h6>
    <a routerLink="/admin/categories" class="btn btn-sm btn-link" style="color:#B88577">Gérer les catégories</a>
  </div>
  @if (stats()!.topCategories.length === 0) {
    <div class="empty-state">Aucune donnée</div>
  } @else {
    <table class="table mb-0">
      <thead>
        <tr><th>#</th><th>Catégorie</th><th>Articles vendus</th><th>Revenu</th><th>Part du CA</th></tr>
      </thead>
      <tbody>
        @for (c of stats()!.topCategories; track c.categoryId; let i = $index) {
          <tr>
            <td class="rank">{{ i + 1 }}</td>
            <td><strong>{{ c.name }}</strong> <small class="text-muted">({{ c.slug }})</small></td>
            <td><span class="count-badge">{{ c.quantitySold }}</span></td>
            <td><strong>{{ c.revenue | money:'MAD' }}</strong></td>
            <td>
              <div class="progress" style="height:6px; background:#FBE9E5">
                <div class="progress-bar" [style.width.%]="percent(c.revenue, totalRevenue())"
                     style="background:#3D2817"></div>
              </div>
              <small class="text-muted">{{ percent(c.revenue, totalRevenue()) }}%</small>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>
}
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; align-items:end; margin-bottom:1.5rem; }
    .page-header h1 { font-family:'Playfair Display'; font-size:1.85rem; font-weight:600; margin:0; color:var(--velisse-brown); }
    .page-sub { color:#8B7068; font-size:.9rem; margin:0; }

    .header-tabs { display:inline-flex; background:#fff; border:1px solid #EDE4DE; border-radius:8px; padding:4px; }
    .tab-btn { border:none; background:transparent; padding:.4rem .85rem; border-radius:6px; font-size:.82rem; color:#8B7068; font-weight:500; cursor:pointer; }
    .tab-btn:hover { color:var(--velisse-brown); }
    .tab-btn.active { background:#B88577; color:#fff; }

    .chart-card { background:#fff; border:1px solid #EDE4DE; border-radius:12px; padding:1.25rem; }
    .chart-header { display:flex; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
    .chart-header h6 { font-family:'Poppins'; font-weight:600; margin:0; color:var(--velisse-brown); font-size:1rem; }
    .chart-header small { color:#8B7068; font-size:.8rem; }
    .chart-canvas-wrap { position:relative; }

    .data-card { background:#fff; border:1px solid #EDE4DE; border-radius:12px; overflow:hidden; }
    .card-header-flex { padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EDE4DE; }
    .card-header-flex h6 { margin:0; font-family:'Poppins'; font-weight:600; color:var(--velisse-brown); font-size:1rem; }
    .data-card .table { margin:0; }
    .data-card .table th { background:#FAF7F4; color:#8B7068; font-weight:500; font-size:.74rem; text-transform:uppercase; letter-spacing:.08em; padding:.65rem 1.25rem; border-bottom:1px solid #EDE4DE; }
    .data-card .table td { padding:.75rem 1.25rem; border-bottom:1px solid #EDE4DE; vertical-align:middle; }
    .data-card .table tr:last-child td { border-bottom:none; }
    .data-card .table tbody tr:hover { background:#FDF7F4; }

    .rank { color:#B88577; font-weight:700; font-family:'Playfair Display'; font-size:1.1rem; }
    .count-badge { background:#FBE9E5; color:#B88577; padding:.25rem .65rem; border-radius:12px; font-weight:600; font-size:.85rem; }
    .empty-state { padding:2rem; text-align:center; color:#8B7068; }
  `]
})
export class AnalyticsComponent {
  private api = inject(ApiService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  range = signal(30);

  totalRevenue = computed(() => {
    const s = this.stats(); if (!s) return 0;
    return s.monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  });
  totalOrderCount = computed(() => {
    const s = this.stats(); if (!s) return 0;
    return s.monthlyRevenue.reduce((sum, m) => sum + m.orderCount, 0);
  });
  productsMaxRev = computed(() => {
    const s = this.stats(); if (!s || s.topProducts.length === 0) return 1;
    return Math.max(...s.topProducts.map(p => p.revenue));
  });

  // ============ CHARTS ============
  monthlyChart = computed<ChartConfiguration<'bar'>['data']>(() => {
    const s = this.stats();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return {
      labels: (s?.monthlyRevenue ?? []).map(m => `${monthNames[m.month - 1]} ${m.year}`),
      datasets: [{
        label: 'Revenu (MAD)',
        data: (s?.monthlyRevenue ?? []).map(m => m.revenue),
        backgroundColor: '#B88577',
        borderRadius: 6, borderSkipped: false
      }]
    };
  });

  monthlyOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F0DDD7' }, ticks: { color: '#8B7068', callback: v => `${v} DH` } },
      x: { grid: { display: false }, ticks: { color: '#8B7068' } }
    }
  };

  topProductsChart = computed<ChartConfiguration<'bar'>['data']>(() => {
    const s = this.stats();
    return {
      labels: (s?.topProducts ?? []).map(p => p.name.length > 24 ? p.name.slice(0, 24) + '…' : p.name),
      datasets: [{
        label: 'Revenu (MAD)',
        data: (s?.topProducts ?? []).map(p => p.revenue),
        backgroundColor: '#B88577',
        borderRadius: 4, borderSkipped: false
      }]
    };
  });

  topProductsOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#F0DDD7' }, ticks: { color: '#8B7068', callback: v => `${v} DH` } },
      y: { grid: { display: false }, ticks: { color: '#3D2817', font: { size: 11 } } }
    }
  };

  categoriesChart = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const s = this.stats();
    return {
      labels: (s?.topCategories ?? []).map(c => c.name),
      datasets: [{
        data: (s?.topCategories ?? []).map(c => c.revenue),
        backgroundColor: ['#B88577', '#3D2817', '#D49A5C', '#6B8E5A', '#9C6E60'],
        borderWidth: 2, borderColor: '#fff'
      }]
    };
  });

  categoriesOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    cutout: '60%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } }
  };

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<DashboardStats>('/admin/stats/dashboard', { days: this.range(), topCount: 8 }).subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.stats.set(null); this.loading.set(false); }
    });
  }

  setRange(d: number) { this.range.set(d); this.load(); }
  percent(val: number, total: number): number {
    if (!total) return 0;
    return Math.round(100 * val / total);
  }
}
