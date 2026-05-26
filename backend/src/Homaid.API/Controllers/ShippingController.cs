using Homaid.API.Common;
using Homaid.Application.Interfaces.Shipping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Homaid.API.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting("api")]
[Route("api/shipping")]
public class ShippingController : ControllerBase
{
    private readonly IShippingService _svc;
    public ShippingController(IShippingService svc) => _svc = svc;

    [HttpGet("methods")]
    public async Task<IActionResult> All(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _svc.GetAllAsync(ct)));

    [HttpGet("methods/by-country/{countryCode}")]
    public async Task<IActionResult> ByCountry(string countryCode, CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _svc.GetAvailableForCountryAsync(countryCode, ct)));
}
