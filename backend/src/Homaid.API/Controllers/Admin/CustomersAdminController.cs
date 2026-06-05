using Homaid.API.Common;
using Homaid.Application.DTOs.Customers;
using Homaid.Application.Interfaces.Customers;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = AuthConstants.PolicyAdmin)]
[Route("api/admin/customers")]
public class CustomersAdminController : ControllerBase
{
    private readonly ICustomerAdminService _svc;
    public CustomersAdminController(ICustomerAdminService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] AdminCustomersQuery query, CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _svc.ListAsync(query, ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => (await _svc.GetByIdAsync(id, ct)).ToActionResult();

    [HttpGet("{id:guid}/orders")]
    public async Task<IActionResult> Orders(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => (await _svc.ListOrdersAsync(id, page, pageSize, ct)).ToActionResult();

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetCustomerActiveRequest req, CancellationToken ct)
        => (await _svc.SetActiveAsync(id, req.IsActive, ct)).ToActionResult();
}
