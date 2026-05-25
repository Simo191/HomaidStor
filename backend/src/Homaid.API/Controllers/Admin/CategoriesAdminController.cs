using Homaid.API.Common;
using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = AuthConstants.PolicyAdmin)]
[Route("api/admin/categories")]
public class CategoriesAdminController : ControllerBase
{
    private readonly ICategoryAdminService _svc;
    public CategoriesAdminController(ICategoryAdminService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<object>.Ok(await _svc.ListAsync(new PageQuery(page, pageSize), search, ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        => (await _svc.GetByIdAsync(id, ct)).ToActionResult();

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertCategoryRequest req, CancellationToken ct)
        => (await _svc.CreateAsync(req, ct)).ToActionResult();

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertCategoryRequest req, CancellationToken ct)
        => (await _svc.UpdateAsync(id, req, ct)).ToActionResult();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => (await _svc.DeleteAsync(id, ct)).ToActionResult();
}
