using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Domain.Common;
using Homaid.Domain.Entities;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Homaid.Infrastructure.Services.Catalog;

public class ProductAdminService : IProductAdminService
{
    private readonly HomaidDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ICurrentUser _current;

    public ProductAdminService(HomaidDbContext db, IMemoryCache cache, ICurrentUser current)
    {
        _db = db;
        _cache = cache;
        _current = current;
    }

    public async Task<PagedResult<ProductListDto>> ListAsync(ProductListQuery q, bool includeInactive = true, CancellationToken ct = default)
    {
        var page = new PageQuery(q.Page, q.PageSize);
        var query = _db.Products.AsNoTracking()
            .Include(p => p.Category).ThenInclude(c => c.Translations)
            .Include(p => p.Brand)
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .AsQueryable();

        if (!includeInactive) query = query.Where(p => p.IsActive);
        if (q.CategoryId is { } cid) query = query.Where(p => p.CategoryId == cid);
        if (q.BrandId is { } bid) query = query.Where(p => p.BrandId == bid);
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
                p.Translations.Any(t => EF.Functions.ILike(t.Name, s)));
        }

        query = q.SortBy?.ToLowerInvariant() switch
        {
            "price_asc"  => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "stock_asc"  => query.OrderBy(p => p.StockQuantity),
            "name_asc"   => query.OrderBy(p => p.Slug),
            _            => query.OrderByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync(ct);
        var products = await query.Skip(page.Skip).Take(page.Take).ToListAsync(ct);
        var items = products.Select(p => MapList(p, LanguageCodes.Default)).ToList();
        return new PagedResult<ProductListDto>(items, total, page.Page, page.Take);
    }

    public async Task<Result<ProductDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _db.Products
            .Include(x => x.Category).ThenInclude(c => c.Translations)
            .Include(x => x.Brand)
            .Include(x => x.Translations)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return p is null
            ? Result.Failure<ProductDetailDto>(Error.NotFound("product.not_found", "Produit introuvable."))
            : Result.Success(MapDetail(p, LanguageCodes.Default));
    }

    public async Task<Result<ProductDetailDto>> CreateAsync(UpsertProductRequest req, CancellationToken ct = default)
    {
        var validation = await ValidateRequestAsync(req, currentId: null, ct);
        if (validation.IsFailure) return Result.Failure<ProductDetailDto>(validation.Error);

        var p = new Product
        {
            Sku = req.Sku.Trim(),
            Slug = req.Slug.Trim().ToLowerInvariant(),
            CategoryId = req.CategoryId,
            BrandId = req.BrandId,
            BasePrice = req.BasePrice,
            CompareAtPrice = req.CompareAtPrice,
            Currency = req.Currency.ToUpperInvariant(),
            StockQuantity = Math.Max(0, req.StockQuantity),
            LowStockThreshold = Math.Max(0, req.LowStockThreshold),
            WeightKg = req.WeightKg,
            Barcode = req.Barcode,
            Attributes = req.Attributes,
            IsActive = req.IsActive,
            IsFeatured = req.IsFeatured,
            PublishedAt = req.PublishedAt ?? (req.IsActive ? DateTime.UtcNow : null)
        };

        foreach (var t in req.Translations.Where(t => LanguageCodes.IsSupported(t.LanguageCode)))
        {
            p.Translations.Add(new ProductTranslation
            {
                LanguageCode = t.LanguageCode.ToLowerInvariant(),
                Name = t.Name,
                ShortDescription = t.ShortDescription,
                Description = t.Description,
                MetaTitle = t.MetaTitle,
                MetaDescription = t.MetaDescription
            });
        }

        for (int i = 0; i < req.Images.Count; i++)
        {
            var img = req.Images[i];
            p.Images.Add(new ProductImage
            {
                Url = img.Url,
                AltText = img.AltText,
                SortOrder = img.SortOrder == 0 ? i : img.SortOrder,
                IsPrimary = img.IsPrimary
            });
        }

        EnsurePrimaryImage(p);

        if (p.StockQuantity > 0)
        {
            p.StockMovements.Add(new StockMovement
            {
                MovementType = StockMovementType.In,
                Quantity = p.StockQuantity,
                StockBefore = 0,
                StockAfter = p.StockQuantity,
                Reason = "Initial stock on creation",
                AdminId = _current.Id
            });
        }

        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return await GetByIdAsync(p.Id, ct);
    }

    public async Task<Result<ProductDetailDto>> UpdateAsync(Guid id, UpsertProductRequest req, CancellationToken ct = default)
    {
        var p = await _db.Products
            .Include(x => x.Translations)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return Result.Failure<ProductDetailDto>(Error.NotFound("product.not_found", "Produit introuvable."));

        var validation = await ValidateRequestAsync(req, currentId: id, ct);
        if (validation.IsFailure) return Result.Failure<ProductDetailDto>(validation.Error);

        var stockBefore = p.StockQuantity;

        p.Sku = req.Sku.Trim();
        p.Slug = req.Slug.Trim().ToLowerInvariant();
        p.CategoryId = req.CategoryId;
        p.BrandId = req.BrandId;
        p.BasePrice = req.BasePrice;
        p.CompareAtPrice = req.CompareAtPrice;
        p.Currency = req.Currency.ToUpperInvariant();
        p.LowStockThreshold = Math.Max(0, req.LowStockThreshold);
        p.WeightKg = req.WeightKg;
        p.Barcode = req.Barcode;
        p.Attributes = req.Attributes;
        var wasActive = p.IsActive;
        p.IsActive = req.IsActive;
        p.IsFeatured = req.IsFeatured;
        p.PublishedAt = req.PublishedAt ?? p.PublishedAt ?? (req.IsActive && !wasActive ? DateTime.UtcNow : null);

        var newStock = Math.Max(0, req.StockQuantity);
        if (newStock != stockBefore)
        {
            p.StockQuantity = newStock;
            p.StockMovements.Add(new StockMovement
            {
                MovementType = StockMovementType.Adjustment,
                Quantity = newStock - stockBefore,
                StockBefore = stockBefore,
                StockAfter = newStock,
                Reason = "Admin update",
                AdminId = _current.Id
            });
        }

        _db.ProductTranslations.RemoveRange(p.Translations);
        p.Translations = req.Translations
            .Where(t => LanguageCodes.IsSupported(t.LanguageCode))
            .Select(t => new ProductTranslation
            {
                ProductId = p.Id,
                LanguageCode = t.LanguageCode.ToLowerInvariant(),
                Name = t.Name,
                ShortDescription = t.ShortDescription,
                Description = t.Description,
                MetaTitle = t.MetaTitle,
                MetaDescription = t.MetaDescription
            }).ToList();

        _db.ProductImages.RemoveRange(p.Images);
        p.Images = req.Images.Select((img, i) => new ProductImage
        {
            ProductId = p.Id,
            Url = img.Url,
            AltText = img.AltText,
            SortOrder = img.SortOrder == 0 ? i : img.SortOrder,
            IsPrimary = img.IsPrimary
        }).ToList();
        EnsurePrimaryImage(p);

        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return await GetByIdAsync(p.Id, ct);
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return Result.Failure(Error.NotFound("product.not_found", "Produit introuvable."));
        if (await _db.OrderItems.AnyAsync(oi => oi.ProductId == id, ct))
            return Result.Failure(Error.Conflict("product.has_orders", "Impossible : ce produit a déjà été commandé. Désactivez-le plutôt."));
        _db.Products.Remove(p);
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return Result.Success();
    }

    public async Task<Result> SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return Result.Failure(Error.NotFound("product.not_found", "Produit introuvable."));
        p.IsActive = isActive;
        if (isActive && p.PublishedAt is null) p.PublishedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return Result.Success();
    }

    public async Task<Result> AdjustStockAsync(Guid id, int delta, string reason, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return Result.Failure(Error.NotFound("product.not_found", "Produit introuvable."));

        var before = p.StockQuantity;
        var after = before + delta;
        if (after < 0) return Result.Failure(Error.Validation("stock.negative", "Le stock résultant serait négatif."));

        p.StockQuantity = after;
        _db.StockMovements.Add(new StockMovement
        {
            ProductId = p.Id,
            MovementType = delta >= 0 ? StockMovementType.In : StockMovementType.Out,
            Quantity = delta,
            StockBefore = before,
            StockAfter = after,
            Reason = string.IsNullOrWhiteSpace(reason) ? "Manual adjustment" : reason,
            AdminId = _current.Id
        });
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return Result.Success();
    }

    private async Task<Result> ValidateRequestAsync(UpsertProductRequest req, Guid? currentId, CancellationToken ct)
    {
        if (req.BasePrice < 0) return Result.Failure(Error.Validation("product.price_negative", "Le prix ne peut pas être négatif."));
        if (req.Translations.Count == 0) return Result.Failure(Error.Validation("product.translation_required", "Au moins une traduction est requise."));

        var slug = req.Slug.Trim().ToLowerInvariant();
        var sku = req.Sku.Trim();
        if (await _db.Products.AnyAsync(p => p.Slug == slug && p.Id != currentId, ct))
            return Result.Failure(Error.Conflict("product.slug_taken", "Ce slug est déjà utilisé."));
        if (await _db.Products.AnyAsync(p => p.Sku == sku && p.Id != currentId, ct))
            return Result.Failure(Error.Conflict("product.sku_taken", "Ce SKU est déjà utilisé."));
        if (!await _db.Categories.AnyAsync(c => c.Id == req.CategoryId, ct))
            return Result.Failure(Error.Validation("product.category_not_found", "Catégorie inexistante."));
        if (req.BrandId is { } bid && !await _db.Brands.AnyAsync(b => b.Id == bid, ct))
            return Result.Failure(Error.Validation("product.brand_not_found", "Marque inexistante."));

        return Result.Success();
    }

    private static void EnsurePrimaryImage(Product p)
    {
        if (p.Images.Count == 0) return;
        if (!p.Images.Any(i => i.IsPrimary))
        {
            var first = p.Images.OrderBy(i => i.SortOrder).First();
            first.IsPrimary = true;
        }
    }

    private void InvalidateCache()
    {
        foreach (var l in LanguageCodes.Supported)
            _cache.Remove($"products:featured:{l}:8");
    }

    private static ProductListDto MapList(Product p, string lang)
    {
        var t = p.Translations.FirstOrDefault(x => x.LanguageCode == lang) ?? p.Translations.FirstOrDefault();
        var primary = p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).FirstOrDefault();
        var catT = p.Category.Translations.FirstOrDefault(x => x.LanguageCode == lang) ?? p.Category.Translations.FirstOrDefault();
        return new ProductListDto(
            p.Id, p.Sku, p.Slug,
            t?.Name ?? p.Slug, t?.ShortDescription,
            p.BasePrice, p.CompareAtPrice, p.Currency,
            p.StockQuantity, p.StockQuantity > 0, p.IsFeatured,
            primary?.Url,
            p.CategoryId, p.Category.Slug, catT?.Name ?? p.Category.Slug,
            p.BrandId, p.Brand?.Name);
    }

    private static ProductDetailDto MapDetail(Product p, string lang)
    {
        var t = p.Translations.FirstOrDefault(x => x.LanguageCode == lang) ?? p.Translations.FirstOrDefault();
        var catT = p.Category.Translations.FirstOrDefault(x => x.LanguageCode == lang) ?? p.Category.Translations.FirstOrDefault();
        return new ProductDetailDto(
            p.Id, p.Sku, p.Slug,
            t?.Name ?? p.Slug, t?.ShortDescription, t?.Description,
            t?.MetaTitle, t?.MetaDescription,
            p.BasePrice, p.CompareAtPrice, p.Currency,
            p.StockQuantity, p.LowStockThreshold,
            p.StockQuantity > 0, p.IsActive, p.IsFeatured,
            p.WeightKg, p.Barcode, p.Attributes, p.PublishedAt, p.ViewCount,
            p.CategoryId, p.Category.Slug, catT?.Name ?? p.Category.Slug,
            p.BrandId, p.Brand?.Name,
            p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
                .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder, i.IsPrimary)).ToList(),
            p.Translations.Select(x => new ProductTranslationDto(
                x.LanguageCode, x.Name, x.ShortDescription, x.Description, x.MetaTitle, x.MetaDescription)).ToList());
    }
}
