import { Injectable, computed, inject, signal } from '@angular/core';
import { ProductDetail, ProductListItem } from '../models/catalog.models';
import { CartLine } from '../models/notification.models';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'homaid.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private storage = inject(StorageService);

  private _lines = signal<CartLine[]>(this.storage.get<CartLine[]>(STORAGE_KEY) ?? []);

  readonly lines = this._lines.asReadonly();
  readonly itemCount = computed(() => this._lines().reduce((sum, l) => sum + l.quantity, 0));
  readonly subtotal = computed(() => this._lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  readonly isEmpty = computed(() => this._lines().length === 0);
  readonly currency = computed(() => this._lines()[0]?.currency ?? 'MAD');

  add(product: ProductDetail | ProductListItem, quantity = 1): void {
    const lines = [...this._lines()];
    const existing = lines.find(l => l.productId === product.id);
    const stock = 'stockQuantity' in product ? product.stockQuantity : 999;

    if (existing) {
      existing.quantity = Math.min(stock, existing.quantity + quantity);
    } else {
      const img = 'images' in product
        ? product.images?.find(i => i.isPrimary)?.url ?? product.images?.[0]?.url
        : (product as ProductListItem).primaryImageUrl;

      lines.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        imageUrl: img,
        unitPrice: product.basePrice,
        currency: product.currency,
        quantity: Math.min(stock, Math.max(1, quantity)),
        stockQuantity: stock
      });
    }
    this.commit(lines);
  }

  setQuantity(productId: string, quantity: number): void {
    const lines = this._lines().map(l => l.productId === productId
      ? { ...l, quantity: Math.max(1, Math.min(l.stockQuantity || 999, quantity)) }
      : l);
    this.commit(lines);
  }

  remove(productId: string): void {
    this.commit(this._lines().filter(l => l.productId !== productId));
  }

  clear(): void {
    this.commit([]);
  }

  private commit(lines: CartLine[]): void {
    this._lines.set(lines);
    this.storage.set(STORAGE_KEY, lines);
  }
}
