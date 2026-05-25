using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Domain.Common;
using Homaid.Domain.Entities;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Homaid.Infrastructure.Services.Catalog;

public class PublicCatalogService : IPublicCatalogService
{
    private readonly HomaidDbContext _db;
    private readonly ILanguageProvider _lang;
    private readonly IMemoryCache _cache;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public PublicCatalogService(HomaidDbContext db, ILanguageProvider lang, IMemoryCache cache)
    {
        _db = db;
        _lang = lang;
        _cache = cache;
    }

    public async Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken ct = default)
    {
        var lang = _lang.Current;
        var key = $"cat:tree:{lang}";

        if (_cache.TryGetValue(key, out IReadOnlyList<CategoryTreeDto>? cached) && cached is not null)
            return cached;

        var flat = await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .Include(c => c.Translations)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        var byId = flat.ToDictionary(
            c => c.Id,
            c => new CategoryTreeDto(c.Id, c.Slug, ResolveName(c.Translations, lang), c.ImageUrl, c.SortOrder, new()));

        var roots = new List<CategoryTreeDto>();
        foreach (var c in flat)
        {
            var node = byId[c.Id];
            if (c.ParentId is { } pid && byId.TryGetValue(pid, out var parent))
                parent.Children.Add(node);
            else
                roots.Add(node);
        }
        _cache.Set(key, (IReadOnlyList<CategoryTreeDto>)roots, CacheTtl);
        return roots;
    }

    public async Task<IReadOnlyList<CategoryListDto>> GetCategoriesFlatAsync(CancellationToken ct = default)
    {
        var lang = _lang.Current;
        var key = $"cat:flat:{lang}";

        if (_cache.TryGetValue(key, out IReadOnlyList<CategoryListDto>? cached) && cached is not null)
            return cached;

        var data = await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .Include(c => c.Translations)
            .Select(c => new
            {
                c.Id, c.Slug, c.ImageUrl, c.ParentId, c.SortOrder, c.IsActive,
                Translations = c.Translations,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .OrderBy(x => x.SortOrder)
            .ToListAsync(ct);

        var result = (IReadOnlyList<CategoryListDto>)data.Select(x =>
        {
            var t = ResolveTranslation(x.Translations, lang);
            return new CategoryListDto(
                x.Id, x.Slug,
                t?.Name ?? x.Slug,
                t?.Description,
                x.ImageUrl, x.ParentId, x.SortOrder, x.IsActive, x.ProductCount);
        }).ToList();

        _cache.Set(key, result, CacheTtl);
        return result;
    }

    public async Task<Result<CategoryDetailDto>> GetCategoryBySlugAsync(string slug, CancellationToken ct = default)
    {
        var lang = _lang.Current;
        var c = await _db.Categories
            .AsNoTracking()
            .Include(x => x.Translations)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive, ct);

        if (c is null)
            return Result.Failure<CategoryDetailDto>(Error.NotFound("category.not_found", "Catégorie introuvable."));

        var t = ResolveTranslation(c.Translations, lang);
        var productCount = await _db.Products.CountAsync(p => p.CategoryId == c.Id && p.IsActive, ct);

        return Result.Success(new CategoryDetailDto(
            c.Id, c.Slug,
            t?.Name ?? c.Slug, t?.Description, t?.MetaTitle, t?.MetaDescription,
            c.ImageUrl, c.ParentId, c.SortOrder, c.IsActive, productCount,
            c.Translations.Select(tr => new CategoryTranslationDto(
                tr.LanguageCode, tr.Name, tr.Description, tr.MetaTitle, tr.MetaDescription)).ToList()));
    }

    public async Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken ct = default)
    {
        const string key = "brands:active";
        if (_cache.TryGetValue(key, out IReadOnlyList<BrandDto>? cached) && cached is not null) return cached;

        var data = await _db.Brands.AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto(
                b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive,
                b.Products.Count(p => p.IsActive)))
            .ToListAsync(ct);

        var result = (IReadOnlyList<BrandDto>)data;
        _cache.Set(key, result, CacheTtl);
        return result;
    }

    public async Task<PagedResult<ProductListDto>> GetProductsAsync(ProductListQuery q, CancellationToken ct = default)
    {
        var lang = _lang.Current;
        var page = new PageQuery(q.Page, q.PageSize);

        var query = _db.Products.AsNoTracking()
            .Include(p => p.Category).ThenInclude(c => c.Translations)
            .Include(p => p.Brand)
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Where(p => p.IsActive);

        if (q.CategoryId is { } cid) query = query.Where(p => p.CategoryId == cid);
        if (!string.IsNullOrWhiteSpace(q.CategorySlug)) query = query.Where(p => p.Category.Slug == q.CategorySlug);
        if (q.BrandId is { } bid) query = query.Where(p => p.BrandId == bid);
        if (!string.IsNullOrWhiteSpace(q.BrandSlug)) query = query.Where(p => p.Brand != null && p.Brand.Slug == q.BrandSlug);
        if (q.MinPrice is { } min) query = query.Where(p => p.BasePrice >= min);
        if (q.MaxPrice is { } max) query = query.Where(p => p.BasePrice <= max);
        if (q.InStockOnly == true) query = query.Where(p => p.StockQuantity > 0);
        if (q.FeaturedOnly == true) query = query.Where(p => p.IsFeatured);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = $"%{q.Search.Trim().ToLower()}%";
            query = query.Where(p =>
                EF.Functions.ILike(p.Sku, s) ||
                EF.Functions.ILike(p.Slug, s) ||
                p.Translations.Any(t => EF.Functions.ILike(t.Name, s) || (t.ShortDescription != null && EF.Functions.ILike(t.ShortDescription, s))));
        }

        query = q.SortBy?.ToLowerInvariant() switch
        {
            "price_asc"  => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "name_asc"   => query.OrderBy(p => p.Slug),
            "popular"    => query.OrderByDescending(p => p.ViewCount).ThenByDescending(p => p.CreatedAt),
            _            => query.OrderByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync(ct);
        var products = await query.Skip(page.Skip).Take(page.Take).ToListAsync(ct);

        var items = products.Select(p => MapList(p, lang)).ToList();
        return new PagedResult<ProductListDto>(items, total, page.Page, page.Take);
    }

    public async Task<Result<ProductDetailDto>> GetProductBySlugAsync(string slug, CancellationToken ct = default)
    {
        var lang = _lang.Current;
        var p = await _db.Products
            .Include(x => x.Category).ThenInclude(c => c.Translations)
            .Include(x => x.Brand)
            .Include(x => x.Translations)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive, ct);

        if (p is null)
            return Result.Failure<ProductDetailDto>(Error.NotFound("product.not_found", "Produit introuvable."));

        p.ViewCount++;
        await _db.SaveChangesAsync(ct);

        return Result.Success(MapDetail(p, lang));
    }

    public async Task<IReadOnlyList<ProductListDto>> GetFeaturedAsync(int take = 8, CancellationToken ct = default)
    {
        var lang = _lang.Current;
        var key = $"products:featured:{lang}:{take}";
        if (_cache.TryGetValue(key, out IReadOnlyList<ProductListDto>? cached) && cached is not null) return cached;

        var products = await _db.Products.AsNoTracking()
            .Include(p => p.Category).ThenInclude(c => c.Translations)
            .Include(p => p.Brand)
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .ToListAsync(ct);

        var items = (IReadOnlyList<ProductListDto>)products.Select(p => MapList(p, lang)).ToList();
        _cache.Set(key, items, CacheTtl);
        return items;
    }

    private static ProductListDto MapList(Product p, string lang)
    {
        var t = ResolveTranslation(p.Translations, lang);
        var primary = p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).FirstOrDefault();
        var catName = ResolveName(p.Category.Translations, lang);
        return new ProductListDto(
            p.Id, p.Sku, p.Slug,
            t?.Name ?? p.Slug, t?.ShortDescription,
            p.BasePrice, p.CompareAtPrice, p.Currency,
            p.StockQuantity, p.StockQuantity > 0, p.IsFeatured,
            primary?.Url,
            p.CategoryId, p.Category.Slug, catName,
            p.BrandId, p.Brand?.Name);
    }

    private static ProductDetailDto MapDetail(Product p, string lang)
    {
        var t = ResolveTranslation(p.Translations, lang);
        var catName = ResolveName(p.Category.Translations, lang);

        return new ProductDetailDto(
            p.Id, p.Sku, p.Slug,
            t?.Name ?? p.Slug, t?.ShortDescription, t?.Description,
            t?.MetaTitle, t?.MetaDescription,
            p.BasePrice, p.CompareAtPrice, p.Currency,
            p.StockQuantity, p.LowStockThreshold,
            p.StockQuantity > 0, p.IsActive, p.IsFeatured,
            p.WeightKg, p.Barcode, p.Attributes, p.PublishedAt, p.ViewCount,
            p.CategoryId, p.Category.Slug, catName,
            p.BrandId, p.Brand?.Name,
            p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
                .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder, i.IsPrimary)).ToList(),
            p.Translations.Select(tr => new ProductTranslationDto(
                tr.LanguageCode, tr.Name, tr.ShortDescription, tr.Description, tr.MetaTitle, tr.MetaDescription)).ToList());
    }

    private static string ResolveName(IEnumerable<CategoryTranslation> translations, string lang)
    {
        var t = translations.FirstOrDefault(x => x.LanguageCode == lang)
             ?? translations.FirstOrDefault(x => x.LanguageCode == LanguageCodes.Default)
             ?? translations.FirstOrDefault();
        return t?.Name ?? string.Empty;
    }

    private static ProductTranslation? ResolveTranslation(IEnumerable<ProductTranslation> translations, string lang)
        => translations.FirstOrDefault(x => x.LanguageCode == lang)
        ?? translations.FirstOrDefault(x => x.LanguageCode == LanguageCodes.Default)
        ?? translations.FirstOrDefault();

    private static CategoryTranslation? ResolveTranslation(IEnumerable<CategoryTranslation> translations, string lang)
        => translations.FirstOrDefault(x => x.LanguageCode == lang)
        ?? translations.FirstOrDefault(x => x.LanguageCode == LanguageCodes.Default)
        ?? translations.FirstOrDefault();
}
