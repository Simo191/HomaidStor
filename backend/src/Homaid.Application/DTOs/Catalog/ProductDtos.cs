using System.Text.Json;

namespace Homaid.Application.DTOs.Catalog;

public record ProductImageDto(
    Guid Id,
    string Url,
    string? AltText,
    int SortOrder,
    bool IsPrimary);

public record ProductListDto(
    Guid Id,
    string Sku,
    string Slug,
    string Name,
    string? ShortDescription,
    decimal BasePrice,
    decimal? CompareAtPrice,
    string Currency,
    int StockQuantity,
    bool IsInStock,
    bool IsFeatured,
    string? PrimaryImageUrl,
    Guid CategoryId,
    string CategorySlug,
    string CategoryName,
    Guid? BrandId,
    string? BrandName);

public record ProductDetailDto(
    Guid Id,
    string Sku,
    string Slug,
    string Name,
    string? ShortDescription,
    string? Description,
    string? MetaTitle,
    string? MetaDescription,
    decimal BasePrice,
    decimal? CompareAtPrice,
    string Currency,
    int StockQuantity,
    int LowStockThreshold,
    bool IsInStock,
    bool IsActive,
    bool IsFeatured,
    decimal? WeightKg,
    string? Barcode,
    JsonDocument? Attributes,
    DateTime? PublishedAt,
    int ViewCount,
    Guid CategoryId,
    string CategorySlug,
    string CategoryName,
    Guid? BrandId,
    string? BrandName,
    IReadOnlyList<ProductImageDto> Images,
    IReadOnlyList<ProductTranslationDto> Translations);

public record ProductTranslationDto(
    string LanguageCode,
    string Name,
    string? ShortDescription,
    string? Description,
    string? MetaTitle,
    string? MetaDescription);

public record ProductListQuery(
    string? Search = null,
    string? CategorySlug = null,
    Guid? CategoryId = null,
    string? BrandSlug = null,
    Guid? BrandId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? InStockOnly = null,
    bool? FeaturedOnly = null,
    string SortBy = "newest",
    int Page = 1,
    int PageSize = 20);

public record UpsertProductImageDto(
    string Url,
    string? AltText,
    int SortOrder,
    bool IsPrimary);

public record UpsertProductRequest(
    string Sku,
    string Slug,
    Guid CategoryId,
    Guid? BrandId,
    decimal BasePrice,
    decimal? CompareAtPrice,
    string Currency,
    int StockQuantity,
    int LowStockThreshold,
    decimal? WeightKg,
    string? Barcode,
    JsonDocument? Attributes,
    bool IsActive,
    bool IsFeatured,
    DateTime? PublishedAt,
    List<ProductTranslationDto> Translations,
    List<UpsertProductImageDto> Images);
