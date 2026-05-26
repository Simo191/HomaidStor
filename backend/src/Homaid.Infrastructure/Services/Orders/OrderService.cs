using System.Data;
using Homaid.Application.Common;
using Homaid.Application.DTOs.Orders;
using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Orders;
using Homaid.Domain.Entities;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Orders;

public class OrderService : IOrderService
{
    private readonly HomaidDbContext _db;
    private readonly IOrderNumberGenerator _numbers;
    private readonly ICurrentUser _current;

    public OrderService(HomaidDbContext db, IOrderNumberGenerator numbers, ICurrentUser current)
    {
        _db = db;
        _numbers = numbers;
        _current = current;
    }

    public async Task<Result<OrderDetailDto>> PlaceAsync(PlaceOrderRequest req, CancellationToken ct = default)
    {
        if (req.Items.Count == 0)
            return Result.Failure<OrderDetailDto>(Error.Validation("order.empty", "Le panier est vide."));

        Customer? customer = null;
        if (_current.IsAuthenticated && _current.PrincipalType == "customer" && _current.Id is { } cid)
        {
            customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == cid, ct);
            if (customer is null || !customer.IsActive)
                return Result.Failure<OrderDetailDto>(Error.Unauthorized("order.invalid_customer", "Compte client invalide."));
        }
        else
        {
            if (string.IsNullOrWhiteSpace(req.GuestEmail) ||
                string.IsNullOrWhiteSpace(req.GuestPhone) ||
                string.IsNullOrWhiteSpace(req.GuestFirstName) ||
                string.IsNullOrWhiteSpace(req.GuestLastName))
            {
                return Result.Failure<OrderDetailDto>(Error.Validation("order.guest_info_required",
                    "Inscription requise OU informations invité complètes (email, téléphone, prénom, nom)."));
            }
        }

        var quantities = req.Items
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        var productIds = quantities.Keys.ToList();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .Include(p => p.Images)
            .Include(p => p.Translations)
            .ToListAsync(ct);

        if (products.Count != productIds.Count)
            return Result.Failure<OrderDetailDto>(Error.NotFound("order.product_missing", "Un produit du panier n'existe plus."));

        foreach (var p in products)
        {
            if (!p.IsActive)
                return Result.Failure<OrderDetailDto>(Error.Validation("order.product_inactive", $"Produit indisponible : {p.Sku}."));
            var requested = quantities[p.Id];
            if (p.StockQuantity < requested)
                return Result.Failure<OrderDetailDto>(Error.Conflict("order.insufficient_stock",
                    $"Stock insuffisant pour {p.Sku} (disponible : {p.StockQuantity}, demandé : {requested})."));
        }

        var shippingMethod = await _db.ShippingMethods
            .Include(m => m.Zone)
            .FirstOrDefaultAsync(m => m.Id == req.ShippingMethodId && m.IsActive, ct);
        if (shippingMethod is null)
            return Result.Failure<OrderDetailDto>(Error.Validation("order.shipping_invalid", "Méthode de livraison invalide."));

        var countryUpper = req.ShippingAddress.CountryCode.ToUpperInvariant();
        if (!shippingMethod.Zone.CountryCodes.Contains(countryUpper))
            return Result.Failure<OrderDetailDto>(Error.Validation("order.shipping_country_mismatch",
                $"Cette méthode de livraison n'est pas disponible pour le pays {countryUpper}."));

        var paymentMethod = req.PaymentMethod ?? (countryUpper == "MA" ? PaymentMethod.CashOnDelivery : PaymentMethod.BankTransfer);
        if (countryUpper != "MA" && paymentMethod == PaymentMethod.CashOnDelivery)
            return Result.Failure<OrderDetailDto>(Error.Validation("order.cod_morocco_only",
                "Le paiement à la livraison n'est disponible qu'au Maroc."));

        var firstCurrency = products.Select(p => p.Currency).Distinct().Single();

        var subtotal = products.Sum(p => p.BasePrice * quantities[p.Id]);
        var shippingFee = shippingMethod.FreeShippingThreshold is { } ft && subtotal >= ft
            ? 0m
            : shippingMethod.BaseFee;
        var taxAmount = 0m;
        var discountAmount = 0m;
        var total = subtotal + shippingFee + taxAmount - discountAmount;

        Order? createdOrder = null;
        await using (var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct))
        {
            var order = new Order
            {
                OrderNumber = await _numbers.NextAsync(ct),
                CustomerId = customer?.Id,
                GuestEmail = customer?.Email ?? req.GuestEmail ?? string.Empty,
                GuestPhone = customer?.Phone ?? req.GuestPhone ?? string.Empty,
                GuestFirstName = customer?.FirstName ?? req.GuestFirstName ?? string.Empty,
                GuestLastName = customer?.LastName ?? req.GuestLastName ?? string.Empty,

                Status = OrderStatus.Pending,
                PaymentMethod = paymentMethod,
                PaymentStatus = paymentMethod == PaymentMethod.BankTransfer
                    ? PaymentStatus.AwaitingTransfer
                    : PaymentStatus.Pending,

                ShippingFullName = req.ShippingAddress.FullName,
                ShippingPhone = req.ShippingAddress.Phone,
                ShippingStreet = req.ShippingAddress.Street,
                ShippingStreetComplement = req.ShippingAddress.StreetComplement,
                ShippingCity = req.ShippingAddress.City,
                ShippingRegion = req.ShippingAddress.Region,
                ShippingPostalCode = req.ShippingAddress.PostalCode,
                ShippingCountryCode = countryUpper,

                ShippingMethodId = shippingMethod.Id,
                ShippingMethodName = shippingMethod.Name,

                Subtotal = subtotal,
                ShippingFee = shippingFee,
                TaxAmount = taxAmount,
                DiscountAmount = discountAmount,
                Total = total,
                Currency = firstCurrency,

                CustomerNotes = req.CustomerNotes
            };

            foreach (var (productId, qty) in quantities)
            {
                var p = products.First(x => x.Id == productId);
                var primaryImg = p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).FirstOrDefault();
                var nameSnapshot = p.Translations.FirstOrDefault(t => t.LanguageCode == (customer?.PreferredLanguage ?? "fr"))?.Name
                                   ?? p.Translations.FirstOrDefault()?.Name
                                   ?? p.Slug;

                order.Items.Add(new OrderItem
                {
                    ProductId = p.Id,
                    ProductSku = p.Sku,
                    ProductNameSnapshot = nameSnapshot,
                    ProductImageSnapshot = primaryImg?.Url,
                    UnitPrice = p.BasePrice,
                    Quantity = qty,
                    LineTotal = p.BasePrice * qty
                });

                var before = p.StockQuantity;
                p.StockQuantity -= qty;
                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = p.Id,
                    MovementType = StockMovementType.Out,
                    Quantity = -qty,
                    StockBefore = before,
                    StockAfter = p.StockQuantity,
                    Reason = $"Order {order.OrderNumber}",
                    OrderId = order.Id
                });
            }

            order.StatusHistory.Add(new OrderStatusHistory
            {
                FromStatus = OrderStatus.Pending,
                ToStatus = OrderStatus.Pending,
                Notes = "Order created",
                ChangedBy = customer is null ? "guest" : customer.Email
            });

            _db.Orders.Add(order);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            createdOrder = order;
        }

        return await LoadDetailAsync(createdOrder!.Id, ct);
    }

    public async Task<PagedResult<OrderListDto>> ListMineAsync(Guid customerId, PageQuery page, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().Where(o => o.CustomerId == customerId);
        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(o => o.CreatedAt)
            .Skip(page.Skip).Take(page.Take)
            .Include(o => o.Items)
            .ToListAsync(ct);
        return new PagedResult<OrderListDto>(rows.Select(MapList).ToList(), total, page.Page, page.Take);
    }

    public async Task<Result<OrderDetailDto>> GetMineAsync(Guid customerId, Guid orderId, CancellationToken ct = default)
    {
        var o = await LoadFullAsync(orderId, ct);
        if (o is null || o.CustomerId != customerId)
            return Result.Failure<OrderDetailDto>(Error.NotFound("order.not_found", "Commande introuvable."));
        return Result.Success(MapDetail(o));
    }

    public async Task<Result> CancelMineAsync(Guid customerId, Guid orderId, string? reason, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.Items).Include(x => x.StatusHistory)
            .FirstOrDefaultAsync(x => x.Id == orderId && x.CustomerId == customerId, ct);
        if (o is null) return Result.Failure(Error.NotFound("order.not_found", "Commande introuvable."));
        if (o.Status is OrderStatus.Shipped or OrderStatus.Delivered or OrderStatus.Cancelled or OrderStatus.Refunded)
            return Result.Failure(Error.Conflict("order.not_cancellable", "Cette commande n'est plus annulable."));

        return await DoCancelAsync(o, reason, by: o.GuestEmail, ct);
    }

    public async Task<PagedResult<OrderListDto>> ListAdminAsync(AdminOrdersQuery q, CancellationToken ct = default)
    {
        var page = new PageQuery(q.Page, q.PageSize);
        var query = _db.Orders.AsNoTracking().AsQueryable();

        if (q.Status is { } st) query = query.Where(o => o.Status == st);
        if (q.PaymentStatus is { } ps) query = query.Where(o => o.PaymentStatus == ps);
        if (q.From is { } from) query = query.Where(o => o.CreatedAt >= from);
        if (q.To is { } to) query = query.Where(o => o.CreatedAt <= to);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = $"%{q.Search.Trim().ToLower()}%";
            query = query.Where(o =>
                EF.Functions.ILike(o.OrderNumber, s) ||
                EF.Functions.ILike(o.GuestEmail, s) ||
                EF.Functions.ILike(o.ShippingFullName, s) ||
                EF.Functions.ILike(o.ShippingPhone, s));
        }

        var total = await query.CountAsync(ct);
        var rows = await query.OrderByDescending(o => o.CreatedAt)
            .Skip(page.Skip).Take(page.Take)
            .Include(o => o.Items)
            .ToListAsync(ct);
        return new PagedResult<OrderListDto>(rows.Select(MapList).ToList(), total, page.Page, page.Take);
    }

    public async Task<Result<OrderDetailDto>> GetAdminAsync(Guid orderId, CancellationToken ct = default)
    {
        var o = await LoadFullAsync(orderId, ct);
        return o is null
            ? Result.Failure<OrderDetailDto>(Error.NotFound("order.not_found", "Commande introuvable."))
            : Result.Success(MapDetail(o));
    }

    public async Task<Result<OrderDetailDto>> UpdateStatusAsync(Guid orderId, UpdateOrderStatusRequest req, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.StatusHistory).Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (o is null) return Result.Failure<OrderDetailDto>(Error.NotFound("order.not_found", "Commande introuvable."));

        if (!IsTransitionAllowed(o.Status, req.Status))
            return Result.Failure<OrderDetailDto>(Error.Validation("order.invalid_transition",
                $"Transition non autorisée : {o.Status} → {req.Status}."));

        var from = o.Status;
        var now = DateTime.UtcNow;
        o.Status = req.Status;
        switch (req.Status)
        {
            case OrderStatus.Confirmed: o.ConfirmedAt = now; break;
            case OrderStatus.Shipped: o.ShippedAt = now; break;
            case OrderStatus.Delivered:
                o.DeliveredAt = now;
                if (o.PaymentMethod == PaymentMethod.CashOnDelivery)
                {
                    o.PaymentStatus = PaymentStatus.Received;
                    o.PaymentReceivedAt = now;
                }
                break;
            case OrderStatus.Cancelled:
                var cancelResult = await DoCancelAsync(o, req.Notes, by: _current.Email ?? "admin", ct);
                if (cancelResult.IsFailure) return Result.Failure<OrderDetailDto>(cancelResult.Error);
                return await LoadDetailResultAsync(o.Id, ct);
        }

        o.StatusHistory.Add(new OrderStatusHistory
        {
            FromStatus = from,
            ToStatus = req.Status,
            Notes = req.Notes,
            ChangedBy = _current.Email ?? "admin"
        });
        await _db.SaveChangesAsync(ct);
        return Result.Success(MapDetail(o));
    }

    public async Task<Result<OrderDetailDto>> UpdatePaymentStatusAsync(Guid orderId, UpdatePaymentStatusRequest req, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.StatusHistory).FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (o is null) return Result.Failure<OrderDetailDto>(Error.NotFound("order.not_found", "Commande introuvable."));

        o.PaymentStatus = req.PaymentStatus;
        if (!string.IsNullOrWhiteSpace(req.Reference)) o.BankTransferReference = req.Reference;
        if (req.PaymentStatus == PaymentStatus.Received && o.PaymentReceivedAt is null)
            o.PaymentReceivedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await LoadDetailResultAsync(orderId, ct);
    }

    public async Task<Result<OrderDetailDto>> SetInternalNotesAsync(Guid orderId, AdminOrderNotesRequest req, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (o is null) return Result.Failure<OrderDetailDto>(Error.NotFound("order.not_found", "Commande introuvable."));
        o.InternalNotes = req.InternalNotes;
        await _db.SaveChangesAsync(ct);
        return await LoadDetailResultAsync(orderId, ct);
    }

    public async Task<Result> CancelAdminAsync(Guid orderId, string? reason, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.Items).Include(x => x.StatusHistory).FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (o is null) return Result.Failure(Error.NotFound("order.not_found", "Commande introuvable."));
        if (o.Status is OrderStatus.Cancelled or OrderStatus.Refunded)
            return Result.Failure(Error.Conflict("order.already_cancelled", "Commande déjà annulée."));
        return await DoCancelAsync(o, reason, by: _current.Email ?? "admin", ct);
    }

    private async Task<Result> DoCancelAsync(Order o, string? reason, string by, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
            var from = o.Status;
            var now = DateTime.UtcNow;
            o.Status = OrderStatus.Cancelled;
            o.CancelledAt = now;
            o.CancellationReason = reason;

            if (o.Status != from)
            {
                o.StatusHistory.Add(new OrderStatusHistory
                {
                    OrderId = o.Id,
                    FromStatus = from,
                    ToStatus = OrderStatus.Cancelled,
                    Notes = reason,
                    ChangedBy = by
                });
            }

            if (from is OrderStatus.Pending or OrderStatus.Confirmed or OrderStatus.Preparing)
            {
                foreach (var item in o.Items)
                {
                    var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == item.ProductId, ct);
                    if (p is null) continue;
                    var before = p.StockQuantity;
                    p.StockQuantity += item.Quantity;
                    _db.StockMovements.Add(new StockMovement
                    {
                        ProductId = p.Id,
                        MovementType = StockMovementType.In,
                        Quantity = item.Quantity,
                        StockBefore = before,
                        StockAfter = p.StockQuantity,
                        Reason = $"Cancel {o.OrderNumber}",
                        OrderId = o.Id
                    });
                }
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        return Result.Success();
    }

    private static bool IsTransitionAllowed(OrderStatus from, OrderStatus to) => (from, to) switch
    {
        (OrderStatus.Pending, OrderStatus.Confirmed) => true,
        (OrderStatus.Pending, OrderStatus.Cancelled) => true,
        (OrderStatus.Confirmed, OrderStatus.Preparing) => true,
        (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
        (OrderStatus.Preparing, OrderStatus.Shipped) => true,
        (OrderStatus.Preparing, OrderStatus.Cancelled) => true,
        (OrderStatus.Shipped, OrderStatus.Delivered) => true,
        (OrderStatus.Delivered, OrderStatus.Refunded) => true,
        _ => false
    };

    private Task<Order?> LoadFullAsync(Guid orderId, CancellationToken ct)
        => _db.Orders.AsNoTracking().AsSplitQuery()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

    private async Task<Result<OrderDetailDto>> LoadDetailResultAsync(Guid id, CancellationToken ct)
        => Result.Success(MapDetail((await LoadFullAsync(id, ct))!));

    private async Task<Result<OrderDetailDto>> LoadDetailAsync(Guid id, CancellationToken ct)
        => Result.Success(MapDetail((await LoadFullAsync(id, ct))!));

    private static OrderListDto MapList(Order o) => new(
        o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.PaymentMethod,
        o.Total, o.Currency,
        o.Items.Sum(i => i.Quantity),
        $"{o.GuestFirstName} {o.GuestLastName}".Trim(),
        o.GuestEmail, o.GuestPhone,
        o.ShippingCity, o.ShippingCountryCode, o.CreatedAt);

    private static OrderDetailDto MapDetail(Order o) => new(
        o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.PaymentMethod,
        o.CustomerId,
        $"{o.GuestFirstName} {o.GuestLastName}".Trim(),
        o.GuestEmail, o.GuestPhone,
        new ShippingAddressDto(
            o.ShippingFullName, o.ShippingPhone, o.ShippingStreet, o.ShippingStreetComplement,
            o.ShippingCity, o.ShippingRegion, o.ShippingPostalCode, o.ShippingCountryCode),
        o.ShippingMethodId, o.ShippingMethodName,
        o.Subtotal, o.ShippingFee, o.TaxAmount, o.DiscountAmount, o.Total, o.Currency,
        o.CustomerNotes, o.InternalNotes, o.BankTransferReference, o.PaymentReceivedAt,
        o.ConfirmedAt, o.ShippedAt, o.DeliveredAt, o.CancelledAt, o.CancellationReason,
        o.CreatedAt, o.UpdatedAt,
        o.Items.Select(i => new OrderItemDto(
            i.Id, i.ProductId, i.ProductSku, i.ProductNameSnapshot, i.ProductImageSnapshot,
            i.UnitPrice, i.Quantity, i.LineTotal)).ToList(),
        o.StatusHistory.OrderBy(h => h.CreatedAt)
            .Select(h => new OrderStatusHistoryDto(h.FromStatus, h.ToStatus, h.Notes, h.ChangedBy, h.CreatedAt))
            .ToList());
}
