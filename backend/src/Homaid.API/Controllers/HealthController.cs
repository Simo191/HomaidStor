using Homaid.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers;

[ApiController]
[Route("api/health")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    private readonly HomaidDbContext _db;

    public HealthController(HomaidDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var dbOk = await _db.Database.CanConnectAsync(ct);
        return Ok(new
        {
            status = dbOk ? "healthy" : "degraded",
            database = dbOk ? "up" : "down",
            timestamp = DateTime.UtcNow
        });
    }
}
