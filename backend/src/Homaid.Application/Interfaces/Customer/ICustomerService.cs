using Homaid.Application.Common;
using Homaid.Application.DTOs.Customers;

namespace Homaid.Application.Interfaces.Customers;

public interface ICustomerService
{
    Task<Result<CustomerProfileDto>> GetProfileAsync(Guid customerId, CancellationToken ct = default);
    Task<Result<CustomerProfileDto>> UpdateProfileAsync(Guid customerId, UpdateProfileRequest request, CancellationToken ct = default);
}

public interface ICustomerAddressService
{
    Task<IReadOnlyList<CustomerAddressDto>> ListAsync(Guid customerId, CancellationToken ct = default);
    Task<Result<CustomerAddressDto>> GetAsync(Guid customerId, Guid addressId, CancellationToken ct = default);
    Task<Result<CustomerAddressDto>> CreateAsync(Guid customerId, UpsertAddressRequest request, CancellationToken ct = default);
    Task<Result<CustomerAddressDto>> UpdateAsync(Guid customerId, Guid addressId, UpsertAddressRequest request, CancellationToken ct = default);
    Task<Result> DeleteAsync(Guid customerId, Guid addressId, CancellationToken ct = default);
    Task<Result> SetDefaultAsync(Guid customerId, Guid addressId, CancellationToken ct = default);
}
