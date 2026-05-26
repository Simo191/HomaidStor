using Homaid.Application.Common;
using Homaid.Application.DTOs.Notifications;
using Homaid.Application.Interfaces.Notifications;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Notifications;

public class InAppNotificationService : IInAppNotificationService
{
    private readonly HomaidDbContext _db;
    public InAppNotificationService(HomaidDbContext db) => _db = db;

    public Task<PagedResult<NotificationDto>> ListForCustomerAsync(Guid customerId, PageQuery page, bool? unreadOnly = null, CancellationToken ct = default)
        => ListAsync(RecipientType.Customer, customerId, page, unreadOnly, ct);

    public Task<PagedResult<NotificationDto>> ListForAdminAsync(Guid adminId, PageQuery page, bool? unreadOnly = null, CancellationToken ct = default)
        => ListAsync(RecipientType.Admin, adminId, page, unreadOnly, ct);

    private async Task<PagedResult<NotificationDto>> ListAsync(RecipientType type, Guid id, PageQuery page, bool? unreadOnly, CancellationToken ct)
    {
        var q = _db.Notifications.AsNoTracking()
            .Where(n => n.RecipientType == type && n.RecipientId == id && n.Channel == NotificationChannel.InApp);
        if (unreadOnly == true) q = q.Where(n => !n.IsRead);

        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(n => n.CreatedAt)
            .Skip(page.Skip).Take(page.Take)
            .Select(n => new NotificationDto(
                n.Id, n.Type, n.Channel, n.Title, n.Body, n.PayloadJson, n.IsRead, n.ReadAt, n.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<NotificationDto>(rows, total, page.Page, page.Take);
    }

    public async Task<Result> MarkReadAsync(Guid notificationId, RecipientType recipientType, Guid recipientId, CancellationToken ct = default)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId
            && x.RecipientType == recipientType && x.RecipientId == recipientId, ct);
        if (n is null) return Result.Failure(Error.NotFound("notification.not_found", "Notification introuvable."));
        if (!n.IsRead)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return Result.Success();
    }

    public async Task<int> MarkAllReadAsync(RecipientType recipientType, Guid recipientId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await _db.Notifications
            .Where(n => n.RecipientType == recipientType && n.RecipientId == recipientId && !n.IsRead && n.Channel == NotificationChannel.InApp)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsRead, true).SetProperty(x => x.ReadAt, now), ct);
    }

    public Task<int> CountUnreadAsync(RecipientType recipientType, Guid recipientId, CancellationToken ct = default)
        => _db.Notifications.AsNoTracking()
            .CountAsync(n => n.RecipientType == recipientType && n.RecipientId == recipientId && !n.IsRead && n.Channel == NotificationChannel.InApp, ct);
}
