import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  timeoutMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  show(type: ToastType, message: string, timeoutMs = 4000): void {
    const id = this.nextId++;
    const toast: Toast = { id, type, message, timeoutMs };
    this._toasts.update(l => [...l, toast]);
    setTimeout(() => this.dismiss(id), timeoutMs);
  }

  success(msg: string) { this.show('success', msg); }
  error(msg: string) { this.show('error', msg, 6000); }
  info(msg: string) { this.show('info', msg); }
  warning(msg: string) { this.show('warning', msg); }

  dismiss(id: number): void {
    this._toasts.update(l => l.filter(t => t.id !== id));
  }
}
