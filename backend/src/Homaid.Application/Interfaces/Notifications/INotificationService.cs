using Homaid.Application.Common;
using Homaid.Application.DTOs.Notifications;
using Homaid.Domain.Enums;

namespace Homaid.Application.Interfaces.Notifications;

public interface IEmailSender
{
    Task<bool> SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null, CancellationToken ct = default);
}

public interface IPushNotificationSender
{
    Task<int> SendToCustomerAsync(Guid customerId, string title, string body, object? payload = null, CancellationToken ct = default);
    Task<int> SendToAdminAsync(Guid adminId, string title, string body, object? payload = null, CancellationToken ct = default);
    Task<int> SendToAllAdminsAsync(string title, string body, object? payload = null, CancellationToken ct = default);
    string? GetVapidPublicKey();
}

public interface INotificationService
{
    Task NotifyOrderPlacedAsync(Guid orderId, CancellationToken ct = default);
    Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus newStatus, CancellationToken ct = default);
    Task NotifyOrderCancelledAsync(Guid orderId, string? reason, CancellationToken ct = default);
    Task NotifyLowStockAsync(Guid productId, int currentStock, CancellationToken ct = default);
}

public interface IInAppNotificationService
{
    Task<PagedResult<NotificationDto>> ListForCustomerAsync(Guid customerId, PageQuery page, bool? unreadOnly = null, CancellationToken ct = default);
    Task<PagedResult<NotificationDto>> ListForAdminAsync(Guid adminId, PageQuery page, bool? unreadOnly = null, CancellationToken ct = default);
    Task<Result> MarkReadAsync(Guid notificationId, RecipientType recipientType, Guid recipientId, CancellationToken ct = default);
    Task<int> MarkAllReadAsync(RecipientType recipientType, Guid recipientId, CancellationToken ct = default);
    Task<int> CountUnreadAsync(RecipientType recipientType, Guid recipientId, CancellationToken ct = default);
}

public interface IPushSubscriptionService
{
    Task<Result> SubscribeCustomerAsync(Guid customerId, PushSubscriptionRequest req, string? userAgent, CancellationToken ct = default);
    Task<Result> SubscribeAdminAsync(Guid adminId, PushSubscriptionRequest req, string? userAgent, CancellationToken ct = default);
    Task<Result> UnsubscribeAsync(string endpoint, CancellationToken ct = default);
}
