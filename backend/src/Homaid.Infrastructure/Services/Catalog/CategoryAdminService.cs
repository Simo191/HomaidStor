using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Domain.Common;
using Homaid.Domain.Entities;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Homaid.Infrastructure.Services.Catalog;

public class CategoryAdminService : ICategoryAdminService
{
    private readonly HomaidDbContext _db;
    private readonly IMemoryCache _cache;

    public CategoryAdminService(HomaidDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<PagedResult<CategoryDetailDto>> ListAsync(PageQuery page, string? search, CancellationToken ct = default)
    {
        var query = _db.Categories.AsNoTracking().Include(c => c.Translations).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim().ToLower()}%";
            query = query.Where(c =>
                EF.Functions.ILike(c.Slug, s) ||
                c.Translations.Any(t => EF.Functions.ILike(t.Name, s)));
        }
        var total = await query.CountAsync(ct);
        var data = await query
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Slug)
            .Skip(page.Skip).Take(page.Take)
            .Select(c => new
            {
                Cat = c,
                ProductCount = c.Products.Count()
            })
            .ToListAsync(ct);

        var items = data.Select(x => Map(x.Cat, x.ProductCount)).ToList();
        return new PagedResult<CategoryDetailDto>(items, total, page.Page, page.Take);
    }

    public async Task<Result<CategoryDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Categories.AsNoTracking().Include(x => x.Translations).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return Result.Failure<CategoryDetailDto>(Error.NotFound("category.not_found", "Catégorie introuvable."));
        var count = await _db.Products.CountAsync(p => p.CategoryId == id, ct);
        return Result.Success(Map(c, count));
    }

    public async Task<Result<CategoryDetailDto>> CreateAsync(UpsertCategoryRequest req, CancellationToken ct = default)
    {
        var slug = req.Slug.Trim().ToLowerInvariant();
        if (await _db.Categories.AnyAsync(c => c.Slug == slug, ct))
            return Result.Failure<CategoryDetailDto>(Error.Conflict("category.slug_taken", "Ce slug est déjà utilisé."));

        if (req.ParentId is { } pid && !await _db.Categories.AnyAsync(c => c.Id == pid, ct))
            return Result.Failure<CategoryDetailDto>(Error.Validation("category.parent_not_found", "Parent inexistant."));

        var c = new Category
        {
            Slug = slug,
            ParentId = req.ParentId,
            SortOrder = req.SortOrder,
            ImageUrl = req.ImageUrl,
            IsActive = req.IsActive,
            Translations = req.Translations
                .Where(t => LanguageCodes.IsSupported(t.LanguageCode))
                .Select(t => new CategoryTranslation
                {
                    LanguageCode = t.LanguageCode.ToLowerInvariant(),
                    Name = t.Name,
                    Description = t.Description,
                    MetaTitle = t.MetaTitle,
                    MetaDescription = t.MetaDescription
                }).ToList()
        };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return Result.Success(Map(c, 0));
    }

    public async Task<Result<CategoryDetailDto>> UpdateAsync(Guid id, UpsertCategoryRequest req, CancellationToken ct = default)
    {
        var c = await _db.Categories.Include(x => x.Translations).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return Result.Failure<CategoryDetailDto>(Error.NotFound("category.not_found", "Catégorie introuvable."));

        var slug = req.Slug.Trim().ToLowerInvariant();
        if (slug != c.Slug && await _db.Categories.AnyAsync(x => x.Slug == slug, ct))
            return Result.Failure<CategoryDetailDto>(Error.Conflict("category.slug_taken", "Ce slug est déjà utilisé."));

        if (req.ParentId == id)
            return Result.Failure<CategoryDetailDto>(Error.Validation("category.self_parent", "Une catégorie ne peut pas être son propre parent."));

        c.Slug = slug;
        c.ParentId = req.ParentId;
        c.SortOrder = req.SortOrder;
        c.ImageUrl = req.ImageUrl;
        c.IsActive = req.IsActive;

        _db.CategoryTranslations.RemoveRange(c.Translations);
        c.Translations = req.Translations
            .Where(t => LanguageCodes.IsSupported(t.LanguageCode))
            .Select(t => new CategoryTranslation
            {
                CategoryId = c.Id,
                LanguageCode = t.LanguageCode.ToLowerInvariant(),
                Name = t.Name,
                Description = t.Description,
                MetaTitle = t.MetaTitle,
                MetaDescription = t.MetaDescription
            }).ToList();

        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        var count = await _db.Products.CountAsync(p => p.CategoryId == id, ct);
        return Result.Success(Map(c, count));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return Result.Failure(Error.NotFound("category.not_found", "Catégorie introuvable."));
        if (await _db.Products.AnyAsync(p => p.CategoryId == id, ct))
            return Result.Failure(Error.Conflict("category.has_products", "Impossible : des produits sont liés à cette catégorie."));
        if (await _db.Categories.AnyAsync(x => x.ParentId == id, ct))
            return Result.Failure(Error.Conflict("category.has_children", "Impossible : la catégorie a des sous-catégories."));
        _db.Categories.Remove(c);
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return Result.Success();
    }

    private static CategoryDetailDto Map(Category c, int productCount)
    {
        var t = c.Translations.FirstOrDefault(x => x.LanguageCode == LanguageCodes.Default)
             ?? c.Translations.FirstOrDefault();
        return new CategoryDetailDto(
            c.Id, c.Slug,
            t?.Name ?? c.Slug, t?.Description, t?.MetaTitle, t?.MetaDescription,
            c.ImageUrl, c.ParentId, c.SortOrder, c.IsActive, productCount,
            c.Translations.Select(x => new CategoryTranslationDto(
                x.LanguageCode, x.Name, x.Description, x.MetaTitle, x.MetaDescription)).ToList());
    }

    private void InvalidateCache()
    {
        foreach (var l in LanguageCodes.Supported)
        {
            _cache.Remove($"cat:tree:{l}");
            _cache.Remove($"cat:flat:{l}");
        }
    }
}
