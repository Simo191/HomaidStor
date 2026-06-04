import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="admin-container">
  <!-- Sidebar -->
  <aside class="admin-sidebar bg-dark text-white" [class.collapsed]="collapsed()">
    <div class="p-3 border-bottom border-secondary">
      <div class="d-flex justify-content-between align-items-center">
        @if (!collapsed()) {
          <strong><i class="bi bi-shield-lock-fill text-primary"></i> Homaid Admin</strong>
        } @else {
          <i class="bi bi-shield-lock-fill text-primary"></i>
        }
        <button class="btn btn-sm btn-dark p-1" (click)="collapsed.set(!collapsed())">
          <i class="bi" [class.bi-chevron-double-left]="!collapsed()" [class.bi-chevron-double-right]="collapsed()"></i>
        </button>
      </div>
    </div>
    <nav class="nav flex-column p-2">
      <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
         class="nav-link text-white-50">
        <i class="bi bi-speedometer2"></i> @if (!collapsed()) { <span class="ms-2">Tableau de bord</span> }
      </a>
      <a routerLink="/admin/orders" routerLinkActive="active" class="nav-link text-white-50 position-relative">
        <i class="bi bi-receipt"></i> @if (!collapsed()) { <span class="ms-2">Commandes</span> }
        @if (unreadCount() > 0) {
          <span class="badge bg-danger position-absolute top-0 end-0">{{ unreadCount() }}</span>
        }
      </a>
      <a routerLink="/admin/products" routerLinkActive="active" class="nav-link text-white-50">
        <i class="bi bi-box-seam"></i> @if (!collapsed()) { <span class="ms-2">Produits</span> }
      </a>
      <a routerLink="/admin/categories" routerLinkActive="active" class="nav-link text-white-50">
        <i class="bi bi-tags"></i> @if (!collapsed()) { <span class="ms-2">Catégories</span> }
      </a>
      <a routerLink="/admin/brands" routerLinkActive="active" class="nav-link text-white-50">
        <i class="bi bi-bookmark-star"></i> @if (!collapsed()) { <span class="ms-2">Marques</span> }
      </a>
      <a routerLink="/admin/customers" routerLinkActive="active" class="nav-link text-white-50">
        <i class="bi bi-people"></i> @if (!collapsed()) { <span class="ms-2">Clients</span> }
      </a>
      <a routerLink="/admin/notifications" routerLinkActive="active" class="nav-link text-white-50">
        <i class="bi bi-bell"></i> @if (!collapsed()) { <span class="ms-2">Notifications</span> }
      </a>
    </nav>
  </aside>

  <!-- Main -->
  <div class="admin-main">
    <header class="admin-topbar bg-white border-bottom px-3 py-2 d-flex justify-content-between align-items-center">
      <div></div>
      <div class="d-flex align-items-center gap-3">
        <a routerLink="/" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-shop"></i> Voir la boutique
        </a>
        <a routerLink="/admin/notifications" class="position-relative text-decoration-none text-dark">
          <i class="bi bi-bell fs-5"></i>
          @if (unreadCount() > 0) {
            <span class="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">{{ unreadCount() }}</span>
          }
        </a>
        <span class="text-muted small">
          {{ auth.user()?.fullName }} <small>({{ auth.user()?.role }})</small>
        </span>
        <button class="btn btn-sm btn-outline-danger" (click)="logout()">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
    <main class="admin-content p-4">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
  `,
  styles: [`
    .admin-container { display: flex; min-height: 100vh; }
    .admin-sidebar { width: 240px; transition: width .2s; flex-shrink: 0; }
    .admin-sidebar.collapsed { width: 60px; }
    .admin-main { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; }
    .admin-topbar { flex-shrink: 0; }
    .admin-content { flex-grow: 1; background: #f5f7fa; overflow-x: auto; }
    .nav-link { border-radius: .25rem; padding: .6rem .8rem; }
    .nav-link:hover { background: rgba(255,255,255,.08); color: white !important; }
    .nav-link.active { background: var(--homaid-primary); color: white !important; }
  `]
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  collapsed = signal(false);
  unreadCount = signal(0);

  constructor() {
    this.refreshUnread();
    setInterval(() => this.refreshUnread(), 30000);
  }

  refreshUnread() {
    this.api.get<{ count: number }>('/admin/notifications/unread-count').subscribe({
      next: r => this.unreadCount.set(r.count),
      error: () => {}
    });
  }

  logout() {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/admin/login']),
      error: () => this.router.navigate(['/admin/login'])
    });
  }
}
