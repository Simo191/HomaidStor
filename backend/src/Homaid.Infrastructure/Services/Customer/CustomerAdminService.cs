using Homaid.Application.Common;
using Homaid.Application.DTOs.Customers;
using Homaid.Application.DTOs.Orders;
using Homaid.Application.Interfaces.Customers;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Customers;

public class CustomerAdminService : ICustomerAdminService
{
    private readonly HomaidDbContext _db;
    public CustomerAdminService(HomaidDbContext db) => _db = db;

    public async Task<PagedResult<AdminCustomerListDto>> ListAsync(AdminCustomersQuery q, CancellationToken ct = default)
    {
        var page = new PageQuery(q.Page, q.PageSize);
        var query = _db.Customers.AsNoTracking().AsQueryable();

        if (q.Provider is { } prov) query = query.Where(c => c.AuthProvider == prov);
        if (q.IsActive is { } a) query = query.Where(c => c.IsActive == a);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = $"%{q.Search.Trim().ToLower()}%";
            query = query.Where(c =>
                EF.Functions.ILike(c.Email, s) ||
                EF.Functions.ILike(c.FirstName, s) ||
                EF.Functions.ILike(c.LastName, s) ||
                EF.Functions.ILike(c.Phone, s));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip(page.Skip).Take(page.Take)
            .Select(c => new AdminCustomerListDto(
                c.Id, c.Email, c.Phone, c.FirstName, c.LastName,
                c.AuthProvider, c.IsActive,
                c.Orders.Count,
                c.Orders.Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded).Sum(o => o.Total),
                c.CreatedAt, c.LastLoginAt))
            .ToListAsync(ct);

        return new PagedResult<AdminCustomerListDto>(items, total, page.Page, page.Take);
    }

    public async Task<Result<AdminCustomerDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Customers.AsNoTracking()
            .Include(x => x.Addresses)
            .Include(x => x.Orders)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return Result.Failure<AdminCustomerDetailDto>(Error.NotFound("customer.not_found", "Client introuvable."));

        var addresses = c.Addresses.OrderByDescending(a => a.IsDefault).ThenBy(a => a.CreatedAt)
            .Select(a => new AdminCustomerAddressDto(
                a.Id, a.FullName, a.Phone, a.Street, a.StreetComplement,
                a.City, a.Region, a.PostalCode, a.CountryCode, a.IsDefault))
            .ToList();

        var totalSpent = c.Orders
            .Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
            .Sum(o => o.Total);

        return Result.Success(new AdminCustomerDetailDto(
            c.Id, c.Email, c.Phone, c.FirstName, c.LastName, c.PreferredLanguage,
            c.AuthProvider, c.EmailVerified, c.PhoneVerified, c.IsActive,
            c.CreatedAt, c.LastLoginAt,
            c.Orders.Count, totalSpent, addresses));
    }

    public async Task<Result<PagedResult<OrderListDto>>> ListOrdersAsync(Guid id, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var exists = await _db.Customers.AnyAsync(c => c.Id == id, ct);
        if (!exists) return Result.Failure<PagedResult<OrderListDto>>(Error.NotFound("customer.not_found", "Client introuvable."));

        var paging = new PageQuery(page, pageSize);
        var query = _db.Orders.AsNoTracking().Where(o => o.CustomerId == id);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(o => o.CreatedAt)
            .Skip(paging.Skip).Take(paging.Take)
            .Select(o => new OrderListDto(
                o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.PaymentMethod,
                o.Total, o.Currency,
                o.Items.Sum(i => i.Quantity),
                $"{o.GuestFirstName} {o.GuestLastName}".Trim(),
                o.GuestEmail, o.GuestPhone,
                o.ShippingCity, o.ShippingCountryCode, o.CreatedAt))
            .ToListAsync(ct);

        return Result.Success(new PagedResult<OrderListDto>(items, total, paging.Page, paging.Take));
    }

    public async Task<Result> SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return Result.Failure(Error.NotFound("customer.not_found", "Client introuvable."));
        c.IsActive = isActive;
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
