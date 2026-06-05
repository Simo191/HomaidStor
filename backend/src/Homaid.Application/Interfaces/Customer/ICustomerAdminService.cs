using Homaid.Application.Common;
using Homaid.Application.DTOs.Customers;
using Homaid.Application.DTOs.Orders;

namespace Homaid.Application.Interfaces.Customers;

public interface ICustomerAdminService
{
    Task<PagedResult<AdminCustomerListDto>> ListAsync(AdminCustomersQuery query, CancellationToken ct = default);
    Task<Result<AdminCustomerDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<PagedResult<OrderListDto>>> ListOrdersAsync(Guid id, int page = 1, int pageSize = 20, CancellationToken ct = default);
    Task<Result> SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default);
}
