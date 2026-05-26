using System.Text.Json;
using Homaid.Application.Interfaces.Notifications;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WebPush;

namespace Homaid.Infrastructure.Services.Notifications;

public class WebPushSender : IPushNotificationSender
{
    private readonly WebPushOptions _opts;
    private readonly HomaidDbContext _db;
    private readonly ILogger<WebPushSender> _logger;
    private readonly WebPushClient _client = new();

    public WebPushSender(IOptions<WebPushOptions> opts, HomaidDbContext db, ILogger<WebPushSender> logger)
    {
        _opts = opts.Value;
        _db = db;
        _logger = logger;
    }

    public string? GetVapidPublicKey() => _opts.Enabled ? _opts.PublicKey : null;

    public async Task<int> SendToCustomerAsync(Guid customerId, string title, string body, object? payload = null, CancellationToken ct = default)
    {
        if (!_opts.Enabled) return 0;
        var subs = await _db.PushSubscriptions.Where(s => s.CustomerId == customerId).ToListAsync(ct);
        return await SendAsync(subs, title, body, payload, ct);
    }

    public async Task<int> SendToAdminAsync(Guid adminId, string title, string body, object? payload = null, CancellationToken ct = default)
    {
        if (!_opts.Enabled) return 0;
        var subs = await _db.PushSubscriptions.Where(s => s.AdminId == adminId).ToListAsync(ct);
        return await SendAsync(subs, title, body, payload, ct);
    }

    public async Task<int> SendToAllAdminsAsync(string title, string body, object? payload = null, CancellationToken ct = default)
    {
        if (!_opts.Enabled) return 0;
        var subs = await _db.PushSubscriptions.Where(s => s.AdminId != null).ToListAsync(ct);
        return await SendAsync(subs, title, body, payload, ct);
    }

    private async Task<int> SendAsync(IReadOnlyList<Domain.Entities.PushSubscription> subs, string title, string body, object? payload, CancellationToken ct)
    {
        if (subs.Count == 0) return 0;

        var vapid = new VapidDetails(_opts.Subject, _opts.PublicKey, _opts.PrivateKey);
        var json = JsonSerializer.Serialize(new
        {
            title,
            body,
            data = payload,
            timestamp = DateTime.UtcNow
        });

        int success = 0;
        var dead = new List<Domain.Entities.PushSubscription>();

        foreach (var s in subs)
        {
            try
            {
                var sub = new WebPush.PushSubscription(s.Endpoint, s.P256dh, s.Auth);
                await _client.SendNotificationAsync(sub, json, vapid, ct);
                s.LastUsedAt = DateTime.UtcNow;
                success++;
            }
            catch (WebPushException wex) when ((int)wex.StatusCode is 404 or 410)
            {
                _logger.LogInformation("Push subscription {Endpoint} gone (HTTP {Code}), removing", s.Endpoint, (int)wex.StatusCode);
                dead.Add(s);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Push send failed for {Endpoint}", s.Endpoint);
            }
        }

        if (dead.Count > 0)
        {
            _db.PushSubscriptions.RemoveRange(dead);
            await _db.SaveChangesAsync(ct);
        }
        else if (success > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return success;
    }
}

public static class VapidKeyHelper
{
    public static (string publicKey, string privateKey) Generate()
    {
        var pair = VapidHelper.GenerateVapidKeys();
        return (pair.PublicKey, pair.PrivateKey);
    }
}
