using Homaid.Application.Common;
using Homaid.Application.DTOs.Notifications;
using Homaid.Application.Interfaces.Notifications;
using Homaid.Domain.Entities;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Notifications;

public class PushSubscriptionService : IPushSubscriptionService
{
    private readonly HomaidDbContext _db;
    public PushSubscriptionService(HomaidDbContext db) => _db = db;

    public Task<Result> SubscribeCustomerAsync(Guid customerId, PushSubscriptionRequest req, string? userAgent, CancellationToken ct = default)
        => UpsertAsync(req, customerId, adminId: null, userAgent, ct);

    public Task<Result> SubscribeAdminAsync(Guid adminId, PushSubscriptionRequest req, string? userAgent, CancellationToken ct = default)
        => UpsertAsync(req, customerId: null, adminId, userAgent, ct);

    public async Task<Result> UnsubscribeAsync(string endpoint, CancellationToken ct = default)
    {
        var sub = await _db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == endpoint, ct);
        if (sub is null) return Result.Success();
        _db.PushSubscriptions.Remove(sub);
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }

    private async Task<Result> UpsertAsync(PushSubscriptionRequest req, Guid? customerId, Guid? adminId, string? userAgent, CancellationToken ct)
    {
        var existing = await _db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == req.Endpoint, ct);
        if (existing is null)
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                CustomerId = customerId,
                AdminId = adminId,
                Endpoint = req.Endpoint,
                P256dh = req.P256dh,
                Auth = req.Auth,
                UserAgent = userAgent,
                LastUsedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.P256dh = req.P256dh;
            existing.Auth = req.Auth;
            existing.UserAgent = userAgent;
            existing.CustomerId = customerId ?? existing.CustomerId;
            existing.AdminId = adminId ?? existing.AdminId;
            existing.LastUsedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
