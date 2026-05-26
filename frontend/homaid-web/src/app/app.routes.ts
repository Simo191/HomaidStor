import { Routes } from '@angular/router';
import { customerGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Homaid Store' },
      { path: 'catalog', loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent), title: 'Catalogue' },
      { path: 'product/:slug', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent), title: 'Produit' },
      { path: 'cart', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent), title: 'Panier' },

      // Checkout : accessible aussi en invité
      { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent), title: 'Checkout' },
      { path: 'order-success/:orderNumber', loadComponent: () => import('./pages/checkout/order-success.component').then(m => m.OrderSuccessComponent), title: 'Commande confirmée' },

      // Auth
      { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent), title: 'Connexion' },
      { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent), title: 'Inscription' },

      // Account (réservé client)
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
