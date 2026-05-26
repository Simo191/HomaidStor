using Homaid.API.Common;
using Homaid.Application.Common;
using Homaid.Application.DTOs.Orders;
using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Orders;
using Homaid.Application.Interfaces.Shipping;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Homaid.API.Controllers;

[ApiController]
[Route("api/orders")]
[EnableRateLimiting("api")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;
    private readonly ICurrentUser _current;

    public OrdersController(IOrderService orders, ICurrentUser current)
    {
        _orders = orders;
        _current = current;
    }

    [HttpPost]
    public async Task<IActionResult> Place([FromBody] PlaceOrderRequest req, CancellationToken ct)
        => (await _orders.PlaceAsync(req, ct)).ToActionResult();

    [HttpGet("mine")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> ListMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var id = _current.Id ?? Guid.Empty;
        return Ok(ApiResponse<object>.Ok(await _orders.ListMineAsync(id, new PageQuery(page, pageSize), ct)));
    }

    [HttpGet("mine/{id:guid}")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> GetMine(Guid id, CancellationToken ct)
    {
        var cid = _current.Id ?? Guid.Empty;
        return (await _orders.GetMineAsync(cid, id, ct)).ToActionResult();
    }

    [HttpPost("mine/{id:guid}/cancel")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CancelMine(Guid id, [FromBody] CancelOrderRequest req, CancellationToken ct)
    {
        var cid = _current.Id ?? Guid.Empty;
        return (await _orders.CancelMineAsync(cid, id, req.Reason, ct)).ToActionResult();
    }
}
