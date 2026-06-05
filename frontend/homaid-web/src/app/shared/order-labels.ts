import { OrderStatus, PaymentMethod, PaymentStatus } from '../core/models/order.models';

export const ORDER_STATUS_LABELS_FR: Record<OrderStatus, string> = {
  Pending:   'En attente',
  Confirmed: 'Confirmée',
  Preparing: 'En préparation',
  Shipped:   'Expédiée',
  Delivered: 'Livrée',
  Cancelled: 'Annulée',
  Refunded:  'Remboursée'
};

export const PAYMENT_STATUS_LABELS_FR: Record<PaymentStatus, string> = {
  Pending:          'En attente',
  AwaitingTransfer: 'Virement en attente',
  Received:         'Reçu',
  Cancelled:        'Annulé',
  Refunded:         'Remboursé'
};

export const PAYMENT_METHOD_LABELS_FR: Record<PaymentMethod, string> = {
  CashOnDelivery: 'Paiement à la livraison',
  BankTransfer:   'Virement bancaire'
};

export const PAYMENT_METHOD_SHORT_FR: Record<PaymentMethod, string> = {
  CashOnDelivery: 'COD',
  BankTransfer:   'Virement'
};
