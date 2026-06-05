import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Toast, ToastService, ToastType } from '../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="velisse-toast-stack" aria-live="polite" aria-atomic="true">
  @for (t of toasts.toasts(); track t.id) {
    <div class="velisse-toast" [ngClass]="'toast-' + t.type" role="alert">
      <div class="toast-accent"></div>
      <div class="toast-icon">
        <i class="bi" [ngClass]="icon(t.type)"></i>
      </div>
      <div class="toast-body">
        <div class="toast-title">{{ title(t.type) }}</div>
        <div class="toast-message">{{ t.message }}</div>
      </div>
      <button class="toast-close" (click)="toasts.dismiss(t.id)" aria-label="Fermer">
        <i class="bi bi-x-lg"></i>
      </button>
      <div class="toast-progress">
        <div class="toast-progress-bar" [style.animation-duration.ms]="t.timeoutMs"></div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    .velisse-toast-stack {
      position: fixed;
      top: 1.25rem; right: 1.25rem;
      z-index: 1100;
      display: flex; flex-direction: column;
      gap: .65rem;
      max-width: 420px;
      width: calc(100vw - 2.5rem);
      pointer-events: none;
    }
    @media (max-width: 575.98px) {
      .velisse-toast-stack { top: 1rem; right: 1rem; left: 1rem; }
    }

    .velisse-toast {
      pointer-events: auto;
      position: relative;
      display: flex;
      align-items: stretch;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(61, 40, 23, .15),
                  0 2px 6px rgba(61, 40, 23, .08);
      overflow: hidden;
      animation: toastSlideIn .35s cubic-bezier(.18, .89, .32, 1.28) both;
      min-height: 68px;
    }

    .toast-accent {
      width: 4px;
      flex-shrink: 0;
    }

    .toast-icon {
      width: 56px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .toast-body {
      flex-grow: 1;
      padding: .85rem .25rem .85rem 0;
      min-width: 0;
    }
    .toast-title {
      font-family: 'Poppins', system-ui, sans-serif;
      font-weight: 600;
      font-size: .92rem;
      color: #3D2817;
      margin-bottom: .15rem;
      letter-spacing: .01em;
    }
    .toast-message {
      font-size: .85rem;
      color: #6B5544;
      line-height: 1.4;
      word-break: break-word;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #8B7068;
      width: 38px;
      flex-shrink: 0;
      cursor: pointer;
      transition: color .15s;
      font-size: .85rem;
      align-self: flex-start;
      padding-top: .9rem;
    }
    .toast-close:hover { color: #3D2817; }

    .toast-progress {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: rgba(0, 0, 0, .04);
    }
    .toast-progress-bar {
      height: 100%;
      width: 100%;
      animation-name: toastShrink;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      transform-origin: left center;
    }

    /* ============ Type variants ============ */
    .toast-success .toast-accent { background: #2E7D32; }
    .toast-success .toast-icon  { background: #E8F5E9; color: #2E7D32; }
    .toast-success .toast-progress-bar { background: #2E7D32; }

    .toast-error .toast-accent { background: #C62828; }
    .toast-error .toast-icon  { background: #FFEBEE; color: #C62828; }
    .toast-error .toast-progress-bar { background: #C62828; }

    .toast-warning .toast-accent { background: #C09000; }
    .toast-warning .toast-icon  { background: #FFF4E0; color: #B86E00; }
    .toast-warning .toast-progress-bar { background: #C09000; }

    .toast-info .toast-accent { background: #B88577; }
    .toast-info .toast-icon  { background: #FBE9E5; color: #B88577; }
    .toast-info .toast-progress-bar { background: #B88577; }

    /* ============ Animations ============ */
    @keyframes toastSlideIn {
      from {
        transform: translateX(110%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes toastShrink {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }
  `]
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);

  icon(type: ToastType): string {
    return ({
      success: 'bi-check-circle-fill',
      error:   'bi-exclamation-octagon-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill'
    } as Record<ToastType, string>)[type];
  }

  title(type: ToastType): string {
    return ({
      success: 'Succès',
      error:   'Erreur',
      warning: 'Attention',
      info:    'Information'
    } as Record<ToastType, string>)[type];
  }

  // typing helper for template
  toastType(t: Toast): ToastType { return t.type; }
}
