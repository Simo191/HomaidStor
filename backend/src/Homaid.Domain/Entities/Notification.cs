using Homaid.Domain.Common;
using Homaid.Domain.Enums;

namespace Homaid.Domain.Entities;

public class Notification : BaseEntity
{
    public RecipientType RecipientType { get; set; }
    public Guid RecipientId { get; set; }

    public NotificationType Type { get; set; }
    public NotificationChannel Channel { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    public bool IsSent { get; set; }
    public DateTime? SentAt { get; set; }
    public string? FailureReason { get; set; }
}

public class PushSubscription : BaseEntity
{
    public Guid? CustomerId { get; set; }
    public Guid? AdminId { get; set; }

    public string Endpoint { get; set; } = string.Empty;
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public Customer? Customer { get; set; }
    public Admin? Admin { get; set; }
}
