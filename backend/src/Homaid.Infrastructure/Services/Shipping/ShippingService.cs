using Homaid.Application.DTOs.Shipping;
using Homaid.Application.Interfaces.Shipping;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Shipping;

public class ShippingService : IShippingService
{
    private readonly HomaidDbContext _db;
    public ShippingService(HomaidDbContext db) => _db = db;

    public async Task<IReadOnlyList<ShippingMethodDto>> GetAllAsync(CancellationToken ct = default)
    {
        var methods = await _db.ShippingMethods.AsNoTracking()
            .Include(m => m.Zone)
            .Where(m => m.IsActive && m.Zone.IsActive)
            .OrderBy(m => m.Zone.SortOrder).ThenBy(m => m.SortOrder)
            .ToListAsync(ct);
        return methods.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<ShippingMethodDto>> GetAvailableForCountryAsync(string countryCode, CancellationToken ct = default)
    {
        var country = countryCode.ToUpperInvariant();
        var methods = await _db.ShippingMethods.AsNoTracking()
            .Include(m => m.Zone)
            .Where(m => m.IsActive && m.Zone.IsActive && m.Zone.CountryCodes.Contains(country))
            .OrderBy(m => m.SortOrder)
            .ToListAsync(ct);
        return methods.Select(Map).ToList();
    }

    private static ShippingMethodDto Map(Domain.Entities.ShippingMethod m) => new(
        m.Id, m.Name, m.Description, m.BaseFee, m.FreeShippingThreshold,
        m.EstimatedMinDays, m.EstimatedMaxDays,
        m.Zone.Id, m.Zone.Code, m.Zone.Name, m.Zone.CountryCodes);
}
