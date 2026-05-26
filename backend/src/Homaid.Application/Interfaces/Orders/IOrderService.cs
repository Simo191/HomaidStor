using Homaid.Application.Common;
using Homaid.Application.DTOs.Orders;

namespace Homaid.Application.Interfaces.Orders;

public interface IOrderService
{
    Task<Result<OrderDetailDto>> PlaceAsync(PlaceOrderRequest request, CancellationToken ct = default);

    Task<PagedResult<OrderListDto>> ListMineAsync(Guid customerId, PageQuery page, CancellationToken ct = default);
    Task<Result<OrderDetailDto>> GetMineAsync(Guid customerId, Guid orderId, CancellationToken ct = default);
    Task<Result> CancelMineAsync(Guid customerId, Guid orderId, string? reason, CancellationToken ct = default);

    Task<PagedResult<OrderListDto>> ListAdminAsync(AdminOrdersQuery query, CancellationToken ct = default);
    Task<Result<OrderDetailDto>> GetAdminAsync(Guid orderId, CancellationToken ct = default);
    Task<Result<OrderDetailDto>> UpdateStatusAsync(Guid orderId, UpdateOrderStatusRequest req, CancellationToken ct = default);
    Task<Result<OrderDetailDto>> UpdatePaymentStatusAsync(Guid orderId, UpdatePaymentStatusRequest req, CancellationToken ct = default);
    Task<Result<OrderDetailDto>> SetInternalNotesAsync(Guid orderId, AdminOrderNotesRequest req, CancellationToken ct = default);
    Task<Result> CancelAdminAsync(Guid orderId, string? reason, CancellationToken ct = default);
}

public interface IOrderNumberGenerator
{
    Task<string> NextAsync(CancellationToken ct = default);
}
