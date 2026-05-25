namespace Homaid.Domain.Enums;

public enum NotificationType
{
    OrderPlaced = 0,
    OrderConfirmed = 1,
    OrderPreparing = 2,
    OrderShipped = 3,
    OrderDelivered = 4,
    OrderCancelled = 5,
    PaymentReceived = 6,
    LowStock = 7,
    NewCustomer = 8
}

public enum NotificationChannel
{
    InApp = 0,
    Email = 1,
    Push = 2
}

public enum RecipientType
{
    Customer = 0,
    Admin = 1
}
