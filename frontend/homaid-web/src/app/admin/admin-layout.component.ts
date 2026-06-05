import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="admin-container">
  <!-- Sidebar -->
  <aside class="admin-sidebar" [class.collapsed]="collapsed()">
    <div class="sidebar-brand">
      <a routerLink="/admin" class="brand-link">
        @if (!collapsed()) {
          <span class="brand-mark">V</span>
          <span class="brand-text">
            <strong>VELISSE</strong>
            <small>Admin Panel</small>
          </span>
        } @else {
          <span class="brand-mark">V</span>
        }
      </a>
      <button class="collapse-btn d-none d-md-flex" (click)="collapsed.set(!collapsed())">
        <i class="bi" [class.bi-chevron-double-left]="!collapsed()" [class.bi-chevron-double-right]="collapsed()"></i>
      </button>
    </div>

    @if (!collapsed()) {
      <div class="sidebar-section-label">Pilotage</div>
    }

    <nav class="sidebar-nav">
      <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
         class="nav-item">
        <i class="bi bi-grid-1x2-fill"></i>
        @if (!collapsed()) { <span>Tableau de bord</span> }
      </a>
      <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
        <i class="bi bi-receipt"></i>
        @if (!collapsed()) { <span>Commandes</span> }
        @if (unreadCount() > 0) {
          <span class="nav-badge">{{ unreadCount() }}</span>
        }
      </a>

      @if (!collapsed()) {
        <div class="sidebar-section-label">Catalogue</div>
      }

      <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">
        <i class="bi bi-box-seam"></i>
        @if (!collapsed()) { <span>Produits</span> }
      </a>
      <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">
        <i class="bi bi-diagram-3"></i>
        @if (!collapsed()) { <span>Catégories</span> }
      </a>
      <a routerLink="/admin/brands" routerLinkActive="active" class="nav-item">
        <i class="bi bi-bookmark-star"></i>
        @if (!collapsed()) { <span>Marques</span> }
      </a>

      @if (!collapsed()) {
        <div class="sidebar-section-label">Relations</div>
      }

      <a routerLink="/admin/customers" routerLinkActive="active" class="nav-item">
        <i class="bi bi-people"></i>
        @if (!collapsed()) { <span>Clients</span> }
      </a>
      <a routerLink="/admin/notifications" routerLinkActive="active" class="nav-item">
        <i class="bi bi-bell"></i>
        @if (!collapsed()) { <span>Notifications</span> }
        @if (unreadCount() > 0) {
          <span class="nav-badge">{{ unreadCount() }}</span>
        }
      </a>
    </nav>

    @if (!collapsed()) {
      <div class="sidebar-footer">
        <div class="sidebar-help">
          <i class="bi bi-question-circle"></i>
          <div>
            <strong>Besoin d'aide ?</strong>
            <small>support@velisse.ma</small>
          </div>
        </div>
      </div>
    }
  </aside>

  <!-- Main -->
  <div class="admin-main">
    <header class="admin-topbar">
      <button class="topbar-toggle d-md-none" (click)="collapsed.set(!collapsed())">
        <i class="bi bi-list"></i>
      </button>

      <div class="topbar-spacer"></div>

      <div class="topbar-actions">
        <a routerLink="/" class="topbar-action" title="Voir la boutique">
          <i class="bi bi-shop"></i>
          <span class="d-none d-lg-inline ms-1">Voir la boutique</span>
        </a>
        <a routerLink="/admin/notifications" class="topbar-action" title="Notifications">
          <i class="bi bi-bell"></i>
          @if (unreadCount() > 0) {
            <span class="action-badge">{{ unreadCount() }}</span>
          }
        </a>
        <div class="topbar-user">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info d-none d-lg-block">
            <strong>{{ auth.user()?.fullName }}</strong>
            <small>{{ auth.user()?.role }}</small>
          </div>
          <button class="logout-btn" (click)="logout()" title="Déconnexion">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="admin-content">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
  `,
  styles: [`
    :host {
      --admin-bg: #F7F5F1;
      --admin-sidebar-bg: #FFFFFF;
      --admin-text: #3D2817;
      --admin-text-muted: #8B7068;
      --admin-border: #EDE4DE;
      --admin-accent: #B88577;
      --admin-accent-soft: #FBE9E5;
      --admin-card-bg: #FFFFFF;
    }

    .admin-container { display: flex; min-height: 100vh; background: var(--admin-bg); }

    /* ============ SIDEBAR ============ */
    .admin-sidebar {
      width: 248px;
      background: var(--admin-sidebar-bg);
      border-right: 1px solid var(--admin-border);
      flex-shrink: 0;
      transition: width .25s ease;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .admin-sidebar.collapsed { width: 72px; }

    .sidebar-brand {
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--admin-border);
    }
    .brand-link {
      display: flex; align-items: center; gap: .75rem;
      text-decoration: none; color: var(--admin-text);
    }
    .brand-mark {
      width: 36px; height: 36px;
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--admin-accent);
      color: #fff; font-weight: 700; font-size: 1.2rem;
      font-family: 'Playfair Display', Georgia, serif;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.2; }
    .brand-text strong {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.05rem;
      letter-spacing: .08em;
      color: var(--admin-text);
    }
    .brand-text small {
      font-size: .7rem; letter-spacing: .15em;
      text-transform: uppercase; color: var(--admin-accent);
    }
    .collapse-btn {
      width: 28px; height: 28px;
      background: var(--admin-bg); border: 1px solid var(--admin-border);
      color: var(--admin-text-muted); border-radius: 6px;
      align-items: center; justify-content: center;
      cursor: pointer; transition: all .15s;
    }
    .collapse-btn:hover { background: var(--admin-accent-soft); color: var(--admin-accent); }

    .sidebar-section-label {
      padding: 1rem 1.25rem .35rem;
      font-size: .68rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .14em;
      color: var(--admin-text-muted);
    }

    .sidebar-nav { display: flex; flex-direction: column; padding: 0 .75rem; gap: .15rem; }
    .nav-item {
      display: flex; align-items: center; gap: .85rem;
      padding: .7rem .85rem;
      color: var(--admin-text);
      text-decoration: none;
      border-radius: 8px;
      font-size: .9rem;
      font-weight: 500;
      position: relative;
      transition: all .15s;
    }
    .nav-item i { font-size: 1.1rem; flex-shrink: 0; }
    .nav-item:hover {
      background: var(--admin-accent-soft);
      color: var(--admin-accent);
    }
    .nav-item.active {
      background: linear-gradient(90deg, var(--admin-accent-soft) 0%, transparent 100%);
      color: var(--admin-accent);
      font-weight: 600;
    }
    .nav-item.active::before {
      content: ''; position: absolute;
      left: -.75rem; top: 50%; transform: translateY(-50%);
      width: 3px; height: 22px;
      background: var(--admin-accent);
      border-radius: 0 3px 3px 0;
    }
    .nav-badge {
      margin-left: auto;
      background: var(--admin-accent);
      color: #fff;
      font-size: .7rem;
      padding: .15em .55em;
      border-radius: 10px;
      font-weight: 600;
    }

    .sidebar-footer {
      margin-top: auto;
      padding: 1rem;
      border-top: 1px solid var(--admin-border);
    }
    .sidebar-help {
      display: flex; gap: .75rem; align-items: center;
      padding: .75rem;
      background: var(--admin-accent-soft);
      border-radius: 8px;
      color: var(--admin-text);
    }
    .sidebar-help i { color: var(--admin-accent); font-size: 1.4rem; }
    .sidebar-help div { display: flex; flex-direction: column; line-height: 1.2; font-size: .8rem; }
    .sidebar-help small { color: var(--admin-text-muted); font-size: .72rem; }

    /* ============ MAIN ============ */
    .admin-main {
      flex-grow: 1; min-width: 0;
      display: flex; flex-direction: column;
    }

    .admin-topbar {
      background: var(--admin-sidebar-bg);
      border-bottom: 1px solid var(--admin-border);
      padding: .85rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .topbar-toggle {
      background: transparent; border: none;
      width: 36px; height: 36px;
      color: var(--admin-text); font-size: 1.3rem;
      border-radius: 6px;
    }
    .topbar-toggle:hover { background: var(--admin-accent-soft); color: var(--admin-accent); }
    .topbar-spacer { flex-grow: 1; }

    .topbar-actions { display: flex; gap: .5rem; align-items: center; }
    .topbar-action {
      display: inline-flex; align-items: center;
      padding: .5rem .75rem;
      color: var(--admin-text-muted);
      background: transparent; border: 1px solid var(--admin-border);
      border-radius: 8px; text-decoration: none;
      font-size: .85rem; position: relative;
      transition: all .15s;
    }
    .topbar-action:hover {
      background: var(--admin-accent-soft);
      color: var(--admin-accent);
      border-color: var(--admin-accent-soft);
    }
    .action-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--admin-accent); color: #fff;
      font-size: .65rem; padding: .1em .4em;
      border-radius: 8px; min-width: 16px; text-align: center;
      font-weight: 600;
    }

    .topbar-user {
      display: flex; align-items: center; gap: .65rem;
      padding-left: .75rem;
      border-left: 1px solid var(--admin-border);
      margin-left: .5rem;
    }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--admin-accent);
      color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: .85rem;
    }
    .user-info { display: flex; flex-direction: column; line-height: 1.2; }
    .user-info strong { font-size: .85rem; color: var(--admin-text); }
    .user-info small { font-size: .72rem; color: var(--admin-text-muted); }
    .logout-btn {
      background: transparent; border: none;
      width: 34px; height: 34px;
      color: var(--admin-text-muted);
      border-radius: 6px; font-size: 1.1rem;
      transition: all .15s;
    }
    .logout-btn:hover { background: #FCE4E4; color: #D32F2F; }

    .admin-content {
      flex-grow: 1;
      padding: 1.5rem 1.5rem 3rem;
      overflow-x: auto;
    }

    @media (max-width: 767.98px) {
      .admin-sidebar {
        position: fixed; z-index: 1040;
        width: 248px;
        transform: translateX(-100%);
      }
      .admin-sidebar:not(.collapsed) { transform: translateX(0); }
      .admin-sidebar.collapsed { transform: translateX(-100%); }
      .admin-content { padding: 1rem; }
    }
  `]
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  collapsed = signal(window.innerWidth < 768);
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

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'A';
  }

  logout() {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/admin/login']),
      error: () => this.router.navigate(['/admin/login'])
    });
  }
}
