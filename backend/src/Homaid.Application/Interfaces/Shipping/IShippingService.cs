using Homaid.Application.DTOs.Shipping;

namespace Homaid.Application.Interfaces.Shipping;

public interface IShippingService
{
    Task<IReadOnlyList<ShippingMethodDto>> GetAvailableForCountryAsync(string countryCode, CancellationToken ct = default);
    Task<IReadOnlyList<ShippingMethodDto>> GetAllAsync(CancellationToken ct = default);
}
