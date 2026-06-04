import { Routes } from '@angular/router';
import { adminGuard, customerGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  // ============== ADMIN BACK-OFFICE ==============
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/admin-login.component').then(m => m.AdminLoginComponent),
    title: 'Admin · Connexion'
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard.component').then(m => m.DashboardComponent), title: 'Admin · Dashboard' },
      { path: 'orders', loadComponent: () => import('./admin/orders-admin.component').then(m => m.OrdersAdminComponent), title: 'Admin · Commandes' },
      { path: 'orders/:id', loadComponent: () => import('./admin/order-detail-admin.component').then(m => m.OrderDetailAdminComponent), title: 'Admin · Commande' },
      { path: 'products', loadComponent: () => import('./admin/products-admin.component').then(m => m.ProductsAdminComponent), title: 'Admin · Produits' },
      { path: 'products/:id', loadComponent: () => import('./admin/product-form.component').then(m => m.ProductFormComponent), title: 'Admin · Produit' },
      { path: 'categories', loadComponent: () => import('./admin/categories-admin.component').then(m => m.CategoriesAdminComponent), title: 'Admin · Catégories' },
      { path: 'brands', loadComponent: () => import('./admin/brands-admin.component').then(m => m.BrandsAdminComponent), title: 'Admin · Marques' },
      { path: 'customers', loadComponent: () => import('./admin/customers-admin.component').then(m => m.CustomersAdminComponent), title: 'Admin · Clients' },
      { path: 'notifications', loadComponent: () => import('./admin/notifications-admin.component').then(m => m.NotificationsAdminComponent), title: 'Admin · Notifications' }
    ]
  },

  // ============== FRONT OFFICE (BOUTIQUE) ==============
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Homaid Store' },
      { path: 'catalog', loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent), title: 'Catalogue' },
      { path: 'brands', loadComponent: () => import('./pages/brands/brands.component').then(m => m.BrandsPageComponent), title: 'Marques' },
      { path: 'product/:slug', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent), title: 'Produit' },
      { path: 'cart', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent), title: 'Panier' },
      { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent), title: 'Checkout' },
      { path: 'order-success/:orderNumber', loadComponent: () => import('./pages/checkout/order-success.component').then(m => m.OrderSuccessComponent), title: 'Commande confirmée' },
      { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent), title: 'Connexion' },
      { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent), title: 'Inscription' },
      {
        path: 'account',
        canActivate: [customerGuard],
        loadComponent: () => import('./pages/account/account-layout.component').then(m => m.AccountLayoutComponent),
        children: [
          { path: '', loadComponent: () => import('./pages/account/profile.component').then(m => m.ProfileComponent), title: 'Mon profil' },
          { path: 'orders', loadComponent: () => import('./pages/account/orders.component').then(m => m.AccountOrdersComponent), title: 'Mes commandes' },
          { path: 'orders/:id', loadComponent: () => import('./pages/account/order-detail.component').then(m => m.OrderDetailAccountComponent), title: 'Détail commande' }
        ]
      },
      { path: '**', redirectTo: '' }
    ]
  }
];
