import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../models/api.models';
import { OrderDetail, OrderList, PlaceOrderRequest, ShippingMethod } from '../models/order.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = inject(ApiService);

  placeOrder(req: PlaceOrderRequest): Observable<OrderDetail> {
    return this.api.post<OrderDetail>('/orders', req);
  }

  listMine(page = 1, pageSize = 20): Observable<PagedResult<OrderList>> {
    return this.api.get<PagedResult<OrderList>>('/orders/mine', { page, pageSize });
  }

  getMine(id: string): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/orders/mine/${id}`);
  }

  cancelMine(id: string, reason?: string): Observable<void> {
    return this.api.post<void>(`/orders/mine/${id}/cancel`, { reason });
  }
}

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private api = inject(ApiService);

  getMethodsForCountry(countryCode: string): Observable<ShippingMethod[]> {
    return this.api.get<ShippingMethod[]>(`/shipping/methods/by-country/${encodeURIComponent(countryCode)}`);
  }

  getAllMethods(): Observable<ShippingMethod[]> {
    return this.api.get<ShippingMethod[]>('/shipping/methods');
  }
}
