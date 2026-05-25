using Homaid.Application.Common;
using Homaid.Application.DTOs.Catalog;

namespace Homaid.Application.Interfaces.Catalog;

public interface IPublicCatalogService
{
    Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken ct = default);
    Task<IReadOnlyList<CategoryListDto>> GetCategoriesFlatAsync(CancellationToken ct = default);
    Task<Result<CategoryDetailDto>> GetCategoryBySlugAsync(string slug, CancellationToken ct = default);

    Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken ct = default);

    Task<PagedResult<ProductListDto>> GetProductsAsync(ProductListQuery query, CancellationToken ct = default);
    Task<Result<ProductDetailDto>> GetProductBySlugAsync(string slug, CancellationToken ct = default);
    Task<IReadOnlyList<ProductListDto>> GetFeaturedAsync(int take = 8, CancellationToken ct = default);
}
