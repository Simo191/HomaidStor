export type NotificationType =
  | 'OrderPlaced' | 'OrderConfirmed' | 'OrderPreparing' | 'OrderShipped'
  | 'OrderDelivered' | 'OrderCancelled' | 'PaymentReceived'
  | 'LowStock' | 'NewCustomer';

export type NotificationChannel = 'InApp' | 'Email' | 'Push';

export interface AppNotification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  payloadJson?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface PushSubscriptionRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  imageUrl?: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  stockQuantity: number;
}
