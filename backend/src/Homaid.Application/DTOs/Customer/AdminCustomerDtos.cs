using Homaid.Domain.Enums;

namespace Homaid.Application.DTOs.Customers;

public record AdminCustomerListDto(
    Guid Id,
    string Email,
    string Phone,
    string FirstName,
    string LastName,
    AuthProvider AuthProvider,
    bool IsActive,
    int OrderCount,
    decimal TotalSpent,
    DateTime CreatedAt,
    DateTime? LastLoginAt);

public record AdminCustomerAddressDto(
    Guid Id,
    string FullName,
    string Phone,
    string Street,
    string? StreetComplement,
    string City,
    string? Region,
    string? PostalCode,
    string CountryCode,
    bool IsDefault);

public record AdminCustomerDetailDto(
    Guid Id,
    string Email,
    string Phone,
    string FirstName,
    string LastName,
    string PreferredLanguage,
    AuthProvider AuthProvider,
    bool EmailVerified,
    bool PhoneVerified,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    int OrderCount,
    decimal TotalSpent,
    IReadOnlyList<AdminCustomerAddressDto> Addresses);

public record AdminCustomersQuery(
    string? Search = null,
    AuthProvider? Provider = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20);

public record SetCustomerActiveRequest(bool IsActive);
