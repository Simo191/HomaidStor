namespace Homaid.Application.DTOs.Catalog;

public record CategoryListDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string? ImageUrl,
    Guid? ParentId,
    int SortOrder,
    bool IsActive,
    int ProductCount);

public record CategoryTreeDto(
    Guid Id,
    string Slug,
    string Name,
    string? ImageUrl,
    int SortOrder,
    List<CategoryTreeDto> Children);

public record CategoryDetailDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string? MetaTitle,
    string? MetaDescription,
    string? ImageUrl,
    Guid? ParentId,
    int SortOrder,
    bool IsActive,
    int ProductCount,
    IReadOnlyList<CategoryTranslationDto> Translations);

public record CategoryTranslationDto(
    string LanguageCode,
    string Name,
    string? Description,
    string? MetaTitle,
    string? MetaDescription);

public record UpsertCategoryRequest(
    string Slug,
    Guid? ParentId,
    int SortOrder,
    string? ImageUrl,
    bool IsActive,
    List<CategoryTranslationDto> Translations);
