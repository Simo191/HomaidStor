namespace Homaid.Domain.Enums;

public enum PaymentStatus
{
    Pending = 0,
    AwaitingTransfer = 1,
    Received = 2,
    Cancelled = 3,
    Refunded = 4
}
