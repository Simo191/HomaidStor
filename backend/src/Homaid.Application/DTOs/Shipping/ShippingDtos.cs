namespace Homaid.Application.DTOs.Shipping;

public record ShippingMethodDto(
    Guid Id,
    string Name,
    string? Description,
    decimal BaseFee,
    decimal? FreeShippingThreshold,
    int EstimatedMinDays,
    int EstimatedMaxDays,
    Guid ZoneId,
    string ZoneCode,
    string ZoneName,
    List<string> Countries);
