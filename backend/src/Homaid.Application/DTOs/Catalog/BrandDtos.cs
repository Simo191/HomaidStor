namespace Homaid.Application.DTOs.Catalog;

public record BrandDto(
    Guid Id,
    string Name,
    string Slug,
    string? LogoUrl,
    string? Description,
    bool IsActive,
    int ProductCount);

public record UpsertBrandRequest(
    string Name,
    string Slug,
    string? LogoUrl,
    string? Description,
    bool IsActive);
