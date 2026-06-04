import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagedResult } from '../core/models/api.models';
import { ProductListItem } from '../core/models/catalog.models';
import { ApiException, ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
<div class="d-flex justify-content-between mb-3">
  <h1 class="h3 mb-0">Produits</h1>
  <a routerLink="/admin/products/new" class="btn btn-primary"><i class="bi bi-plus"></i> Nouveau produit</a>
</div>

<div class="card mb-3">
  <div class="card-body">
    <div class="row g-2">
      <div class="col-md-6">
        <input class="form-control" placeholder="Rechercher (nom, SKU, slug)..."
               [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
      </div>
      <div class="col-md-3">
        <select class="form-select" [(ngModel)]="filters.sortBy" (ngModelChange)="onFilterChange()">
          <option value="newest">Nouveautés</option>
          <option value="price_asc">Prix ↑</option>
          <option value="price_desc">Prix ↓</option>
          <option value="stock_asc">Stock ↑</option>
          <option value="name_asc">Nom A-Z</option>
        </select>
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-secondary w-100" (click)="reset()">Réinitialiser</button>
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-body p-0">
    @if (loading()) { <div class="text-center p-4"><div class="spinner-border text-primary"></div></div> }
    @else if ((page()?.items?.length ?? 0) === 0) { <div class="text-center p-4 text-muted">Aucun produit.</div> }
    @else {
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>Image</th><th>SKU</th><th>Nom</th><th>Cat.</th><th>Prix</th><th>Stock</th><th>Actif</th><th></th>
        </tr></thead>
        <tbody>
          @for (p of page()!.items; track p.id) {
            <tr>
              <td>
                @if (p.primaryImageUrl) {
                  <img [src]="p.primaryImageUrl" style="width:40px;height:40px;object-fit:cover" class="rounded" [alt]="p.name">
                }
              </td>
              <td><code>{{ p.sku }}</code></td>
              <td>
                <strong>{{ p.name }}</strong>
                @if (p.brandName) { <br><small class="text-muted">{{ p.brandName }}</small> }
              </td>
              <td><small>{{ p.categoryName }}</small></td>
              <td>{{ p.basePrice | money:p.currency }}</td>
              <td>
                <span [class.text-danger]="p.stockQuantity === 0" [class.text-warning]="p.stockQuantity > 0 && p.stockQuantity <= 5">
                  {{ p.stockQuantity }}
                </span>
                <button class="btn btn-sm btn-outline-secondary ms-1" (click)="adjustStock(p)" title="Ajuster">
                  <i class="bi bi-plus-slash-minus"></i>
                </button>
              </td>
              <td>
                <button class="btn btn-sm" [class.btn-success]="p.isInStock || p.stockQuantity > 0"
                        (click)="toggleActive(p)" title="Activer/Désactiver">
                  <i class="bi" [class.bi-toggle-on]="isActive(p)" [class.bi-toggle-off]="!isActive(p)"></i>
                </button>
              </td>
              <td>
                <a [routerLink]="['/admin/products', p.id]" class="btn btn-sm btn-outline-primary me-1">
                  <i class="bi bi-pencil"></i>
                </a>
                <button class="btn btn-sm btn-outline-danger" (click)="delete(p)">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>
  @if (page() && page()!.totalPages > 1) {
    <div class="card-footer d-flex justify-content-center">
      <nav><ul class="pagination mb-0">
        <li class="page-item" [class.disabled]="!page()!.hasPrevious"><button class="page-link" (click)="goToPage(page()!.page - 1)"><i class="bi bi-chevron-left"></i></button></li>
        <li class="page-item disabled"><span class="page-link">{{ page()!.page }} / {{ page()!.totalPages }}</span></li>
        <li class="page-item" [class.disabled]="!page()!.hasNext"><button class="page-link" (click)="goToPage(page()!.page + 1)"><i class="bi bi-chevron-right"></i></button></li>
      </ul></nav>
    </div>
  }
</div>
  `
})
export class ProductsAdminComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  page = signal<PagedResult<ProductListItem> | null>(null);
  loading = signal(true);
  activeMap = new Map<string, boolean>();

  filters: { search?: string; sortBy: string; page: number; pageSize: number; includeInactive: boolean } = {
    sortBy: 'newest', page: 1, pageSize: 20, includeInactive: true
  };
  private debounce?: ReturnType<typeof setTimeout>;

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PagedResult<ProductListItem>>('/admin/products', this.filters as Record<string, unknown>).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  isActive(p: ProductListItem): boolean {
    return this.activeMap.get(p.id) ?? (p.stockQuantity > 0 || p.isFeatured || true);
  }

  onFilterChange() {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.filters.page = 1; this.load(); }, 300);
  }

  reset() { this.filters = { sortBy: 'newest', page: 1, pageSize: 20, includeInactive: true }; this.load(); }
  goToPage(n: number) { this.filters.page = n; this.load(); }

  toggleActive(p: ProductListItem) {
    const current = this.isActive(p);
    this.api.patch<void>(`/admin/products/${p.id}/active`, { isActive: !current }).subscribe({
      next: () => { this.activeMap.set(p.id, !current); this.toast.success(current ? 'Désactivé' : 'Activé'); this.load(); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  adjustStock(p: ProductListItem) {
    const deltaStr = prompt(`Stock actuel : ${p.stockQuantity}. Entre le delta (+ ou -)`, '');
    if (deltaStr === null) return;
    const delta = Number(deltaStr);
    if (!Number.isFinite(delta) || delta === 0) return;
    const reason = prompt('Raison (optionnel)', 'Ajustement manuel') ?? 'Ajustement manuel';
    this.api.post<void>(`/admin/products/${p.id}/stock-adjustment`, { delta, reason }).subscribe({
      next: () => { this.toast.success('Stock mis à jour'); this.load(); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }

  delete(p: ProductListItem) {
    if (!confirm(`Supprimer "${p.name}" ? (refus si déjà commandé)`)) return;
    this.api.delete(`/admin/products/${p.id}`).subscribe({
      next: () => { this.toast.success('Supprimé'); this.load(); },
      error: (e: ApiException) => this.toast.error(e.message)
    });
  }
}
