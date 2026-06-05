import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../core/models/order.models';
import {
  ORDER_STATUS_LABELS_FR,
  PAYMENT_METHOD_LABELS_FR,
  PAYMENT_METHOD_SHORT_FR,
  PAYMENT_STATUS_LABELS_FR
} from '../order-labels';

@Pipe({ name: 'orderStatusLabel', standalone: true })
export class OrderStatusLabelPipe implements PipeTransform {
  transform(value: OrderStatus | string | null | undefined): string {
    if (!value) return '';
    return ORDER_STATUS_LABELS_FR[value as OrderStatus] ?? String(value);
  }
}

@Pipe({ name: 'paymentStatusLabel', standalone: true })
export class PaymentStatusLabelPipe implements PipeTransform {
  transform(value: PaymentStatus | string | null | undefined): string {
    if (!value) return '';
    return PAYMENT_STATUS_LABELS_FR[value as PaymentStatus] ?? String(value);
  }
}

@Pipe({ name: 'paymentMethodLabel', standalone: true })
export class PaymentMethodLabelPipe implements PipeTransform {
  transform(value: PaymentMethod | string | null | undefined, short = false): string {
    if (!value) return '';
    const map = short ? PAYMENT_METHOD_SHORT_FR : PAYMENT_METHOD_LABELS_FR;
    return map[value as PaymentMethod] ?? String(value);
  }
}
