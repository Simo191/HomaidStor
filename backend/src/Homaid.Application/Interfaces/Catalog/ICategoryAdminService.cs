using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;

namespace Homaid.Application.Interfaces.Catalog;

public interface ICategoryAdminService
{
    Task<PagedResult<CategoryDetailDto>> ListAsync(PageQuery page, string? search, CancellationToken ct = default);
    Task<Result<CategoryDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<CategoryDetailDto>> CreateAsync(UpsertCategoryRequest req, CancellationToken ct = default);
    Task<Result<CategoryDetailDto>> UpdateAsync(Guid id, UpsertCategoryRequest req, CancellationToken ct = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IBrandAdminService
{
    Task<PagedResult<BrandDto>> ListAsync(PageQuery page, string? search, CancellationToken ct = default);
    Task<Result<BrandDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<BrandDto>> CreateAsync(UpsertBrandRequest req, CancellationToken ct = default);
    Task<Result<BrandDto>> UpdateAsync(Guid id, UpsertBrandRequest req, CancellationToken ct = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IProductAdminService
{
    Task<PagedResult<ProductListDto>> ListAsync(ProductListQuery query, bool includeInactive = true, CancellationToken ct = default);
    Task<Result<ProductDetailDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<ProductDetailDto>> CreateAsync(UpsertProductRequest req, CancellationToken ct = default);
    Task<Result<ProductDetailDto>> UpdateAsync(Guid id, UpsertProductRequest req, CancellationToken ct = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<Result> SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default);
    Task<Result> AdjustStockAsync(Guid id, int delta, string reason, CancellationToken ct = default);
}
