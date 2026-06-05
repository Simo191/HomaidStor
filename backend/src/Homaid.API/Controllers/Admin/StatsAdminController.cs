using Homaid.API.Common;
using Homaid.Application.Interfaces.Stats;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = AuthConstants.PolicyAdmin)]
[Route("api/admin/stats")]
public class StatsAdminController : ControllerBase
{
    private readonly IStatsService _stats;
    public StatsAdminController(IStatsService stats) => _stats = stats;

    /// <summary>
    /// Stats pour le dashboard : top produits, top catégories, revenu mensuel.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(
        [FromQuery] int days = 30,
        [FromQuery] int topCount = 8,
        CancellationToken ct = default)
        => Ok(ApiResponse<object>.Ok(await _stats.GetDashboardStatsAsync(days, topCount, ct)));
}
