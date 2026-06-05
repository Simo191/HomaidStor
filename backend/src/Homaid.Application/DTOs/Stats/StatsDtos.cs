namespace Homaid.Application.DTOs.Stats;

public record TopProductDto(
    Guid ProductId,
    string Sku,
    string Name,
    string? ImageUrl,
    int QuantitySold,
    decimal Revenue);

public record TopCategoryDto(
    Guid CategoryId,
    string Slug,
    string Name,
    int QuantitySold,
    decimal Revenue);

public record MonthlyRevenueDto(
    int Year,
    int Month,
    decimal Revenue,
    int OrderCount);

public record DashboardStatsDto(
    IReadOnlyList<TopProductDto> TopProducts,
    IReadOnlyList<TopCategoryDto> TopCategories,
    IReadOnlyList<MonthlyRevenueDto> MonthlyRevenue);
