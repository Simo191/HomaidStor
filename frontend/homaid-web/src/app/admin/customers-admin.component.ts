import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCustomerList } from '../core/models/admin-customer.models';
import { PagedResult } from '../core/models/api.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';

@Component({
  selector: 'app-customers-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
<div class="page-header">
  <div>
    <h1>Clients</h1>
    <p class="page-sub">{{ page()?.totalCount ?? 0 }} client(s) au total</p>
  </div>
</div>

<div class="filters-bar mb-3">
  <div class="row g-2">
    <div class="col-md-5">
      <input class="form-control" placeholder="Rechercher (email, nom, téléphone)..."
             [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
    </div>
    <div class="col-md-3">
      <select class="form-select" [(ngModel)]="filters.provider" (ngModelChange)="onFilterChange()">
        <option [ngValue]="undefined">Tous types</option>
        <option value="Local">Inscription locale</option>
        <option value="Google">Google</option>
        <option value="Facebook">Facebook</option>
      </select>
    </div>
    <div class="col-md-2">
      <select class="form-select" [(ngModel)]="filters.isActive" (ngModelChange)="onFilterChange()">
        <option [ngValue]="undefined">Tous statuts</option>
        <option [ngValue]="true">Actifs</option>
        <option [ngValue]="false">Désactivés</option>
      </select>
    </div>
    <div class="col-md-2">
      <button class="btn btn-outline-secondary w-100" (click)="reset()">
        <i class="bi bi-x-circle"></i> Réinitialiser
      </button>
    </div>
  </div>
</div>

<div class="data-card">
  @if (loading()) {
    <div class="text-center p-5"><div class="spinner-border" style="color:var(--velisse-rose-gold)"></div></div>
  } @else if ((page()?.items?.length ?? 0) === 0) {
    <div class="empty-state">
      <i class="bi bi-people display-4"></i>
      <p>Aucun client trouvé.</p>
    </div>
  } @else {
    <table class="table mb-0 align-middle">
      <thead>
        <tr>
          <th>Client</th>
          <th>Téléphone</th>
          <th>Inscription</th>
          <th>Commandes</th>
          <th>Total dépensé</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (c of page()!.items; track c.id) {
          <tr>
            <td>
              <div class="d-flex gap-2 align-items-center">
                <div class="avatar">{{ initials(c) }}</div>
                <div>
                  <strong>{{ c.firstName }} {{ c.lastName }}</strong>
                  <div class="small text-muted">{{ c.email }}</div>
                </div>
              </div>
            </td>
            <td><small>{{ c.phone }}</small></td>
            <td>
              <small>{{ c.createdAt | date:'mediumDate' }}</small>
              <div class="small text-muted">via {{ providerLabel(c.authProvider) }}</div>
            </td>
            <td>
              <span class="count-badge">{{ c.orderCount }}</span>
            </td>
            <td><strong>{{ c.totalSpent | money:'MAD' }}</strong></td>
            <td>
              @if (c.isActive) {
                <span class="status-pill pill-active">Actif</span>
              } @else {
                <span class="status-pill pill-inactive">Désactivé</span>
              }
            </td>
            <td>
              <div class="d-flex gap-1">
                <a [routerLink]="['/admin/customers', c.id]" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-eye"></i>
                </a>
                <button class="btn btn-sm" [class.btn-outline-success]="!c.isActive" [class.btn-outline-danger]="c.isActive"
                        (click)="toggleActive(c)" [title]="c.isActive ? 'Désactiver' : 'Réactiver'">
                  <i class="bi" [class.bi-person-x]="c.isActive" [class.bi-person-check]="!c.isActive"></i>
                </button>
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>
    @if (page()!.totalPages > 1) {
      <div class="pagination-wrap">
        <button class="btn btn-sm btn-outline-secondary" [disabled]="!page()!.hasPrevious" (click)="goToPage(page()!.page - 1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ page()!.page }} / {{ page()!.totalPages }}</span>
        <button class="btn btn-sm btn-outline-secondary" [disabled]="!page()!.hasNext" (click)="goToPage(page()!.page + 1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    }
  }
</div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; align-items:end; margin-bottom:1.5rem; }
    .page-header h1 { font-family:'Playfair Display', Georgia, serif; font-size:1.85rem; font-weight:600; margin:0; color:var(--velisse-brown); }
    .page-sub { color:#8B7068; font-size:.9rem; margin:0; }

    .filters-bar { background:#fff; padding:1rem; border:1px solid #EDE4DE; border-radius:12px; }

    .data-card { background:#fff; border:1px solid #EDE4DE; border-radius:12px; overflow:hidden; }
    .data-card .table { margin:0; }
    .data-card .table th {
      background:#FAF7F4; color:#8B7068; font-weight:500;
      font-size:.74rem; text-transform:uppercase; letter-spacing:.08em;
      padding:.65rem 1.25rem; border-bottom:1px solid #EDE4DE;
    }
    .data-card .table td { padding:.85rem 1.25rem; border-bottom:1px solid #EDE4DE; vertical-align:middle; }
    .data-card .table tr:last-child td { border-bottom:none; }
    .data-card .table tbody tr:hover { background:#FDF7F4; }

    .avatar {
      width:38px; height:38px; border-radius:50%;
      background:linear-gradient(135deg, #B88577, #9C6E60);
      color:#fff; display:inline-flex; align-items:center; justify-content:center;
      font-weight:600; font-size:.85rem; flex-shrink:0;
    }
    .count-badge {
      background:#FBE9E5; color:#B88577;
      padding:.25rem .65rem; border-radius:12px; font-weight:600; font-size:.85rem;
    }
    /* Status pills come from global styles.scss */

    .empty-state { text-align:center; padding:3rem; color:#8B7068; }
    .empty-state i { color:#D5C2BB; }

    .pagination-wrap {
      display:flex; gap:.5rem; align-items:center; justify-content:center;
      padding:1rem; border-top:1px solid #EDE4DE; background:#FAF7F4;
    }
    .page-info { font-size:.85rem; color:#8B7068; }
  `]
})
export class CustomersAdminComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  page = signal<PagedResult<AdminCustomerList> | null>(null);
  loading = signal(true);
  filters: { search?: string; provider?: string; isActive?: boolean; page: number; pageSize: number } = {
    page: 1, pageSize: 20
  };
  private debounce?: ReturnType<typeof setTimeout>;

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PagedResult<AdminCustomerList>>('/admin/customers', this.filters as Record<string, unknown>).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.filters.page = 1; this.load(); }, 300);
  }

  reset() { this.filters = { page: 1, pageSize: 20 }; this.load(); }
  goToPage(p: number) { this.filters.page = p; this.load(); }

  toggleActive(c: AdminCustomerList) {
    this.api.patch<void>(`/admin/customers/${c.id}/active`, { isActive: !c.isActive }).subscribe({
      next: () => { this.toast.success(c.isActive ? 'Client désactivé' : 'Client réactivé'); this.load(); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  initials(c: AdminCustomerList): string {
    return `${(c.firstName[0] ?? '').toUpperCase()}${(c.lastName[0] ?? '').toUpperCase()}` || c.email[0].toUpperCase();
  }

  providerLabel(p: string): string {
    return ({ Local: 'Inscription', Google: 'Google', Facebook: 'Facebook' } as Record<string, string>)[p] ?? p;
  }
}
