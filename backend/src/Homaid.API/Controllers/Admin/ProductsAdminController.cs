using Homaid.API.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers.Admin;

public record SetActiveRequest(bool IsActive);
public record AdjustStockRequest(int Delta, string Reason);

[ApiController]
[Authorize(Policy = AuthConstants.PolicyAdmin)]
[Route("api/admin/products")]
public class ProductsAdminController : ControllerBase
{
    private readonly IProductAdminService _svc;
    public ProductsAdminController(IProductAdminService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] ProductListQuery query, [FromQuery] bool includeInactive = true, CancellationToken ct = default)
        => Ok(ApiResponse<object>.Ok(await _svc.ListAsync(query, includeInactive, ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => (await _svc.GetByIdAsync(id, ct)).ToActionResult();

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertProductRequest req, CancellationToken ct)
        => (await _svc.CreateAsync(req, ct)).ToActionResult();

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertProductRequest req, CancellationToken ct)
        => (await _svc.UpdateAsync(id, req, ct)).ToActionResult();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => (await _svc.DeleteAsync(id, ct)).ToActionResult();

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest req, CancellationToken ct)
        => (await _svc.SetActiveAsync(id, req.IsActive, ct)).ToActionResult();

    [HttpPost("{id:guid}/stock-adjustment")]
    public async Task<IActionResult> AdjustStock(Guid id, [FromBody] AdjustStockRequest req, CancellationToken ct)
        => (await _svc.AdjustStockAsync(id, req.Delta, req.Reason, ct)).ToActionResult();
}
