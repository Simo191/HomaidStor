import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer.component';
import { HeaderComponent } from './header.component';
import { ToastContainerComponent } from './toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent],
  template: `
<app-header></app-header>
<main class="flex-grow-1">
  <router-outlet></router-outlet>
</main>
<app-footer></app-footer>
<app-toasts></app-toasts>
  `,
  styles: [`:host { display: flex; flex-direction: column; min-height: 100vh; }`]
})
export class MainLayoutComponent {}
