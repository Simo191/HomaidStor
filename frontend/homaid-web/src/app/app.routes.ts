import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Homaid Store' },
      // Catalog, product detail, cart, checkout, account, auth — à venir dans les prochains tours
      { path: 'catalog', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Catalogue' },
      { path: 'product/:slug', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Produit' },
      { path: 'cart', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Panier' },
      { path: 'login', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Connexion' },
      { path: 'register', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Inscription' },
      { path: '**', redirectTo: '' }
    ]
  }
];
