import { Routes } from '@angular/router';
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
      // Checkout, account, auth — à venir tour 3
      { path: 'checkout', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent), title: 'Checkout' },
      { path: 'login', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Connexion' },
      { path: 'register', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Inscription' },
      { path: '**', redirectTo: '' }
    ]
  }
];
