using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Domain.Entities;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Homaid.Infrastructure.Services.Catalog;

public class BrandAdminService : IBrandAdminService
{
    private readonly HomaidDbContext _db;
    private readonly IMemoryCache _cache;

    public BrandAdminService(HomaidDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<PagedResult<BrandDto>> ListAsync(PageQuery page, string? search, CancellationToken ct = default)
    {
        var query = _db.Brands.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim().ToLower()}%";
            query = query.Where(b => EF.Functions.ILike(b.Name, s) || EF.Functions.ILike(b.Slug, s));
        }
        var total = await query.CountAsync(ct);
        var data = await query
            .OrderBy(b => b.Name)
            .Skip(page.Skip).Take(page.Take)
            .Select(b => new BrandDto(b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive, b.Products.Count()))
            .ToListAsync(ct);
        return new PagedResult<BrandDto>(data, total, page.Page, page.Take);
    }

    public async Task<Result<BrandDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var b = await _db.Brands.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new BrandDto(x.Id, x.Name, x.Slug, x.LogoUrl, x.Description, x.IsActive, x.Products.Count()))
            .FirstOrDefaultAsync(ct);
        return b is null
            ? Result.Failure<BrandDto>(Error.NotFound("brand.not_found", "Marque introuvable."))
            : Result.Success(b);
    }

    public async Task<Result<BrandDto>> CreateAsync(UpsertBrandRequest req, CancellationToken ct = default)
    {
        var slug = req.Slug.Trim().ToLowerInvariant();
        if (await _db.Brands.AnyAsync(b => b.Slug == slug, ct))
            return Result.Failure<BrandDto>(Error.Conflict("brand.slug_taken", "Ce slug est déjà utilisé."));

        var b = new Brand
        {
            Name = req.Name.Trim(),
            Slug = slug,
            LogoUrl = req.LogoUrl,
            Description = req.Description,
            IsActive = req.IsActive
        };
        _db.Brands.Add(b);
        await _db.SaveChangesAsync(ct);
        _cache.Remove("brands:active");
        return Result.Success(new BrandDto(b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive, 0));
    }

    public async Task<Result<BrandDto>> UpdateAsync(Guid id, UpsertBrandRequest req, CancellationToken ct = default)
    {
        var b = await _db.Brands.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b is null) return Result.Failure<BrandDto>(Error.NotFound("brand.not_found", "Marque introuvable."));

        var slug = req.Slug.Trim().ToLowerInvariant();
        if (slug != b.Slug && await _db.Brands.AnyAsync(x => x.Slug == slug, ct))
            return Result.Failure<BrandDto>(Error.Conflict("brand.slug_taken", "Ce slug est déjà utilisé."));

        b.Name = req.Name.Trim();
        b.Slug = slug;
        b.LogoUrl = req.LogoUrl;
        b.Description = req.Description;
        b.IsActive = req.IsActive;

        await _db.SaveChangesAsync(ct);
        _cache.Remove("brands:active");
        var count = await _db.Products.CountAsync(p => p.BrandId == id, ct);
        return Result.Success(new BrandDto(b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive, count));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var b = await _db.Brands.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b is null) return Result.Failure(Error.NotFound("brand.not_found", "Marque introuvable."));
        if (await _db.Products.AnyAsync(p => p.BrandId == id, ct))
            return Result.Failure(Error.Conflict("brand.has_products", "Impossible : des produits sont liés à cette marque."));
        _db.Brands.Remove(b);
        await _db.SaveChangesAsync(ct);
        _cache.Remove("brands:active");
        return Result.Success();
    }
}
