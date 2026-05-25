using Homaid.API.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Homaid.API.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting("api")]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly IPublicCatalogService _svc;

    public CatalogController(IPublicCatalogService svc) => _svc = svc;

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] bool flat = false, CancellationToken ct = default)
    {
        if (flat) return Ok(ApiResponse<object>.Ok(await _svc.GetCategoriesFlatAsync(ct)));
        return Ok(ApiResponse<object>.Ok(await _svc.GetCategoryTreeAsync(ct)));
    }

    [HttpGet("categories/{slug}")]
    public async Task<IActionResult> GetCategory(string slug, CancellationToken ct)
        => (await _svc.GetCategoryBySlugAsync(slug, ct)).ToActionResult();

    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _svc.GetBrandsAsync(ct)));

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] ProductListQuery query, CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _svc.GetProductsAsync(query, ct)));

    [HttpGet("products/featured")]
    public async Task<IActionResult> GetFeatured([FromQuery] int take = 8, CancellationToken ct = default)
        => Ok(ApiResponse<object>.Ok(await _svc.GetFeaturedAsync(take, ct)));

    [HttpGet("products/{slug}")]
    public async Task<IActionResult> GetProduct(string slug, CancellationToken ct)
        => (await _svc.GetProductBySlugAsync(slug, ct)).ToActionResult();
}
