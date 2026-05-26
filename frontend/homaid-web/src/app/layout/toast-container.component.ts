import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100">
  @for (t of toasts.toasts(); track t.id) {
    <div class="toast show mb-2" role="alert" [ngClass]="cssFor(t.type)">
      <div class="d-flex">
        <div class="toast-body">{{ t.message }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                aria-label="Close" (click)="toasts.dismiss(t.id)"></button>
      </div>
    </div>
  }
</div>
  `,
  styles: [`.toast { min-width: 280px; color: white; }`],
  imports: [CommonModule]
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);

  cssFor(type: 'success' | 'error' | 'info' | 'warning'): string {
    return {
      success: 'bg-success',
      error: 'bg-danger',
      info: 'bg-primary',
      warning: 'bg-warning text-dark'
    }[type];
  }
}
