using System.Text.Json;
using Homaid.Application.Interfaces.Notifications;
using Homaid.Domain.Entities;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Homaid.Infrastructure.Services.Notifications;

public class NotificationService : INotificationService
{
    private readonly HomaidDbContext _db;
    private readonly IEmailSender _email;
    private readonly IPushNotificationSender _push;
    private readonly StoreOptions _store;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        HomaidDbContext db,
        IEmailSender email,
        IPushNotificationSender push,
        IOptions<StoreOptions> store,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _email = email;
        _push = push;
        _store = store.Value;
        _logger = logger;
    }

    public async Task NotifyOrderPlacedAsync(Guid orderId, CancellationToken ct = default)
    {
        try
        {
            var order = await _db.Orders.AsNoTracking().Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId, ct);
            if (order is null) return;

            var customerName = $"{order.GuestFirstName} {order.GuestLastName}".Trim();
            var trackUrl = $"{_store.FrontUrl}/orders/{order.OrderNumber}";

            var emailSubject = $"Confirmation de votre commande {order.OrderNumber}";
            var emailHtml = BuildOrderEmailHtml(order, "Merci pour votre commande !",
                $"Bonjour {customerName},<br><br>Nous avons bien reçu votre commande <strong>{order.OrderNumber}</strong>.",
                trackUrl);

            await _email.SendAsync(order.GuestEmail, emailSubject, emailHtml, ct: ct);

            if (order.CustomerId is { } cid)
            {
                await CreateInAppAsync(RecipientType.Customer, cid, NotificationType.OrderPlaced,
                    "Commande reçue",
                    $"Votre commande {order.OrderNumber} a été enregistrée. Total : {order.Total:N2} {order.Currency}.",
                    new { orderNumber = order.OrderNumber, orderId = order.Id, total = order.Total }, ct);

                _ = _push.SendToCustomerAsync(cid, "Commande reçue",
                    $"{order.OrderNumber} - {order.Total:N2} {order.Currency}",
                    new { orderId = order.Id, orderNumber = order.OrderNumber }, ct);
            }

            await NotifyAdminsAsync(NotificationType.OrderPlaced,
                $"Nouvelle commande {order.OrderNumber}",
                $"{customerName} - {order.Items.Count} article(s) - {order.Total:N2} {order.Currency} - {order.ShippingCity}/{order.ShippingCountryCode}",
                new { orderId = order.Id, orderNumber = order.OrderNumber, total = order.Total }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notify order-placed failed for order {OrderId}", orderId);
        }
    }

    public async Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus newStatus, CancellationToken ct = default)
    {
        try
        {
            var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId, ct);
            if (order is null) return;

            var (title, body, type) = newStatus switch
            {
                OrderStatus.Confirmed => ("Commande confirmée", $"Votre commande {order.OrderNumber} est confirmée et en cours de préparation.", NotificationType.OrderConfirmed),
                OrderStatus.Preparing => ("Commande en préparation", $"Nous préparons votre commande {order.OrderNumber}.", NotificationType.OrderPreparing),
                OrderStatus.Shipped   => ("Commande expédiée", $"Votre commande {order.OrderNumber} a été expédiée !", NotificationType.OrderShipped),
                OrderStatus.Delivered => ("Commande livrée", $"Votre commande {order.OrderNumber} a été livrée. Merci !", NotificationType.OrderDelivered),
                _ => (string.Empty, string.Empty, NotificationType.OrderPlaced)
            };
            if (string.IsNullOrEmpty(title)) return;

            await _email.SendAsync(order.GuestEmail, title,
                BuildOrderEmailHtml(order, title,
                    $"Bonjour {order.GuestFirstName},<br><br>{body}",
                    $"{_store.FrontUrl}/orders/{order.OrderNumber}"), ct: ct);

            if (order.CustomerId is { } cid)
            {
                await CreateInAppAsync(RecipientType.Customer, cid, type, title, body,
                    new { orderId = order.Id, orderNumber = order.OrderNumber, status = newStatus.ToString() }, ct);
                _ = _push.SendToCustomerAsync(cid, title, body,
                    new { orderId = order.Id, orderNumber = order.OrderNumber }, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notify status-change failed for order {OrderId}", orderId);
        }
    }

    public async Task NotifyOrderCancelledAsync(Guid orderId, string? reason, CancellationToken ct = default)
    {
        try
        {
            var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId, ct);
            if (order is null) return;

            var title = "Commande annulée";
            var body = $"Votre commande {order.OrderNumber} a été annulée." + (string.IsNullOrWhiteSpace(reason) ? "" : $" Motif : {reason}");

            await _email.SendAsync(order.GuestEmail, title,
                BuildOrderEmailHtml(order, title,
                    $"Bonjour {order.GuestFirstName},<br><br>{body}", $"{_store.FrontUrl}/orders/{order.OrderNumber}"), ct: ct);

            if (order.CustomerId is { } cid)
            {
                await CreateInAppAsync(RecipientType.Customer, cid, NotificationType.OrderCancelled, title, body,
                    new { orderId = order.Id, orderNumber = order.OrderNumber, reason }, ct);
                _ = _push.SendToCustomerAsync(cid, title, body, new { orderId = order.Id }, ct);
            }

            await NotifyAdminsAsync(NotificationType.OrderCancelled,
                $"Commande annulée {order.OrderNumber}",
                $"Total : {order.Total:N2} {order.Currency}. Motif : {reason ?? "(non précisé)"}",
                new { orderId = order.Id, orderNumber = order.OrderNumber, reason }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notify cancellation failed for order {OrderId}", orderId);
        }
    }

    public async Task NotifyLowStockAsync(Guid productId, int currentStock, CancellationToken ct = default)
    {
        try
        {
            var product = await _db.Products.AsNoTracking().Include(p => p.Translations).FirstOrDefaultAsync(p => p.Id == productId, ct);
            if (product is null) return;
            var name = product.Translations.FirstOrDefault(t => t.LanguageCode == _store.DefaultLanguage)?.Name ?? product.Slug;

            await NotifyAdminsAsync(NotificationType.LowStock,
                $"Stock bas : {name}",
                $"Le produit {product.Sku} ({name}) a un stock de {currentStock} unité(s), sous le seuil ({product.LowStockThreshold}).",
                new { productId = product.Id, sku = product.Sku, stock = currentStock }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notify low-stock failed for product {ProductId}", productId);
        }
    }

    private async Task NotifyAdminsAsync(NotificationType type, string title, string body, object? payload, CancellationToken ct)
    {
        var admins = await _db.Admins.AsNoTracking().Where(a => a.IsActive).Select(a => new { a.Id, a.Email }).ToListAsync(ct);
        var payloadJson = payload is null ? null : JsonSerializer.Serialize(payload);

        foreach (var a in admins)
        {
            _db.Notifications.Add(new Notification
            {
                RecipientType = RecipientType.Admin,
                RecipientId = a.Id,
                Type = type,
                Channel = NotificationChannel.InApp,
                Title = title,
                Body = body,
                PayloadJson = payloadJson,
                IsSent = true,
                SentAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync(ct);

        _ = _push.SendToAllAdminsAsync(title, body, payload, ct);

        var primaryAdminEmail = _store.AdminEmail;
        if (!string.IsNullOrWhiteSpace(primaryAdminEmail))
            await _email.SendAsync(primaryAdminEmail, $"[Homaid] {title}", $"<p>{body}</p>", ct: ct);
    }

    private async Task CreateInAppAsync(RecipientType type, Guid id, NotificationType notifType, string title, string body, object? payload, CancellationToken ct)
    {
        _db.Notifications.Add(new Notification
        {
            RecipientType = type,
            RecipientId = id,
            Type = notifType,
            Channel = NotificationChannel.InApp,
            Title = title,
            Body = body,
            PayloadJson = payload is null ? null : JsonSerializer.Serialize(payload),
            IsSent = true,
            SentAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
    }

    private static string BuildOrderEmailHtml(Order order, string heading, string intro, string url) => $@"
<!DOCTYPE html>
<html><head><meta charset='utf-8'></head>
<body style='font-family: Arial, sans-serif; color:#1a1a1a; background:#f7f9fc; margin:0; padding:24px;'>
  <div style='max-width:600px; margin:0 auto; background:#fff; border-radius:8px; padding:32px; box-shadow:0 2px 10px rgba(0,0,0,0.08);'>
    <h1 style='color:#1e88e5; margin:0 0 16px;'>{heading}</h1>
    <p>{intro}</p>
    <table style='width:100%; border-collapse:collapse; margin:24px 0;'>
      <tr><td style='padding:8px; color:#666;'>N° commande</td><td style='padding:8px; font-weight:bold;'>{order.OrderNumber}</td></tr>
      <tr><td style='padding:8px; color:#666;'>Total</td><td style='padding:8px; font-weight:bold;'>{order.Total:N2} {order.Currency}</td></tr>
      <tr><td style='padding:8px; color:#666;'>Paiement</td><td style='padding:8px;'>{order.PaymentMethod}</td></tr>
      <tr><td style='padding:8px; color:#666;'>Statut</td><td style='padding:8px;'>{order.Status}</td></tr>
    </table>
    <p style='text-align:center; margin:32px 0;'>
      <a href='{url}' style='background:#1e88e5; color:#fff; padding:12px 32px; text-decoration:none; border-radius:4px; display:inline-block;'>Suivre ma commande</a>
    </p>
    <hr style='border:none; border-top:1px solid #eee; margin:32px 0;'>
    <p style='color:#888; font-size:12px; text-align:center;'>Homaid Store - cet email est automatique, merci de ne pas y répondre.</p>
  </div>
</body></html>";
}
