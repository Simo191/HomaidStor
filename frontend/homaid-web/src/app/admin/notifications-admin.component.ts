import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { PagedResult } from '../core/models/api.models';
import { AppNotification } from '../core/models/notification.models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="d-flex justify-content-between mb-3">
  <h1 class="h3 mb-0">Notifications</h1>
  @if (page() && page()!.totalCount > 0) {
    <button class="btn btn-sm btn-outline-secondary" (click)="markAllRead()">
      <i class="bi bi-check-all"></i> Tout marquer lu
    </button>
  }
</div>

<div class="card">
  <div class="card-body p-0">
    @if (loading()) { <div class="text-center p-4"><div class="spinner-border text-primary"></div></div> }
    @else if ((page()?.items?.length ?? 0) === 0) {
      <div class="text-center p-5 text-muted">
        <i class="bi bi-bell-slash display-4"></i>
        <p class="mt-3">Aucune notification.</p>
      </div>
    } @else {
      <ul class="list-group list-group-flush">
        @for (n of page()!.items; track n.id) {
          <li class="list-group-item d-flex gap-3" [class.bg-light]="!n.isRead">
            <div class="flex-shrink-0">
              <i class="bi {{ icon(n.type) }} fs-3 text-primary"></i>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <strong>{{ n.title }}</strong>
                <small class="text-muted">{{ n.createdAt | date:'short' }}</small>
              </div>
              <p class="mb-1 small">{{ n.body }}</p>
              @if (!n.isRead) {
                <button class="btn btn-link btn-sm p-0" (click)="markRead(n.id)">Marquer comme lu</button>
              }
            </div>
          </li>
        }
      </ul>
    }
  </div>
  @if (page() && page()!.totalPages > 1) {
    <div class="card-footer d-flex justify-content-center">
      <nav><ul class="pagination mb-0">
        <li class="page-item" [class.disabled]="!page()!.hasPrevious"><button class="page-link" (click)="loadPage(page()!.page - 1)"><i class="bi bi-chevron-left"></i></button></li>
        <li class="page-item disabled"><span class="page-link">{{ page()!.page }} / {{ page()!.totalPages }}</span></li>
        <li class="page-item" [class.disabled]="!page()!.hasNext"><button class="page-link" (click)="loadPage(page()!.page + 1)"><i class="bi bi-chevron-right"></i></button></li>
      </ul></nav>
    </div>
  }
</div>
  `
})
export class NotificationsAdminComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  page = signal<PagedResult<AppNotification> | null>(null);
  loading = signal(true);

  constructor() { this.loadPage(1); }

  loadPage(p: number) {
    this.loading.set(true);
    this.api.get<PagedResult<AppNotification>>('/admin/notifications', { page: p, pageSize: 20 }).subscribe({
      next: r => { this.page.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  markRead(id: string) {
    this.api.patch<void>(`/admin/notifications/${id}/read`, {}).subscribe({
      next: () => this.loadPage(this.page()!.page),
      error: () => {}
    });
  }

  markAllRead() {
    this.api.post<{ updated: number }>('/admin/notifications/read-all', {}).subscribe({
      next: r => { this.toast.success(`${r.updated} notification(s) marquée(s)`); this.loadPage(1); }
    });
  }

  icon(type: string): string {
    return ({
      OrderPlaced: 'bi-cart-plus-fill', OrderConfirmed: 'bi-check-circle-fill',
      OrderPreparing: 'bi-box-seam', OrderShipped: 'bi-truck',
      OrderDelivered: 'bi-check2-square', OrderCancelled: 'bi-x-circle-fill',
      PaymentReceived: 'bi-cash-coin', LowStock: 'bi-exclamation-triangle-fill',
      NewCustomer: 'bi-person-plus-fill'
    } as Record<string, string>)[type] || 'bi-bell-fill';
  }
}
