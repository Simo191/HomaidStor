using Homaid.API.Common;
using Homaid.Application.DTOs.Orders;
using Homaid.Application.Interfaces.Orders;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = AuthConstants.PolicyAdmin)]
[Route("api/admin/orders")]
public class OrdersAdminController : ControllerBase
{
    private readonly IOrderService _orders;
    public OrdersAdminController(IOrderService orders) => _orders = orders;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] AdminOrdersQuery q, CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _orders.ListAdminAsync(q, ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => (await _orders.GetAdminAsync(id, ct)).ToActionResult();

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] UpdateOrderStatusRequest req, CancellationToken ct)
        => (await _orders.UpdateStatusAsync(id, req, ct)).ToActionResult();

    [HttpPatch("{id:guid}/payment")]
    public async Task<IActionResult> SetPaymentStatus(Guid id, [FromBody] UpdatePaymentStatusRequest req, CancellationToken ct)
        => (await _orders.UpdatePaymentStatusAsync(id, req, ct)).ToActionResult();

    [HttpPatch("{id:guid}/internal-notes")]
    public async Task<IActionResult> SetNotes(Guid id, [FromBody] AdminOrderNotesRequest req, CancellationToken ct)
        => (await _orders.SetInternalNotesAsync(id, req, ct)).ToActionResult();

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelOrderRequest req, CancellationToken ct)
        => (await _orders.CancelAdminAsync(id, req.Reason, ct)).ToActionResult();
}
