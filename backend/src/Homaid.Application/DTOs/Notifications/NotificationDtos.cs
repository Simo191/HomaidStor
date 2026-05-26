using System.ComponentModel.DataAnnotations;
using Homaid.Domain.Enums;

namespace Homaid.Application.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    NotificationType Type,
    NotificationChannel Channel,
    string Title,
    string Body,
    string? PayloadJson,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt);

public record UnreadCountDto(int Count);

public record PushSubscriptionRequest(
    [Required, StringLength(500)] string Endpoint,
    [Required, StringLength(200)] string P256dh,
    [Required, StringLength(200)] string Auth);

public record VapidPublicKeyDto(string? PublicKey);
