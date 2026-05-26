export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
export type PaymentStatus = 'Pending' | 'AwaitingTransfer' | 'Received' | 'Cancelled' | 'Refunded';
export type PaymentMethod = 'CashOnDelivery' | 'BankTransfer';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  streetComplement?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
}

export interface PlaceOrderItem {
  productId: string;
  quantity: number;
}

export interface PlaceOrderRequest {
  items: PlaceOrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethodId: string;
  paymentMethod?: PaymentMethod;
  customerNotes?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestFirstName?: string;
  guestLastName?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistory {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  notes?: string;
  changedBy?: string;
  changedAt: string;
}

export interface OrderList {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  currency: string;
  itemCount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingCity: string;
  shippingCountryCode: string;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  shippingMethodId?: string;
  shippingMethodName?: string;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  customerNotes?: string;
  internalNotes?: string;
  bankTransferReference?: string;
  paymentReceivedAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  baseFee: number;
  freeShippingThreshold?: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  countries: string[];
}
