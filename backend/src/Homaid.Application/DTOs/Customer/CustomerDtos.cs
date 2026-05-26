using System.ComponentModel.DataAnnotations;
using Homaid.Domain.Enums;

namespace Homaid.Application.DTOs.Customers;

public record CustomerProfileDto(
    Guid Id,
    string Email,
    string Phone,
    string FirstName,
    string LastName,
    string PreferredLanguage,
    AuthProvider AuthProvider,
    bool EmailVerified,
    bool PhoneVerified,
    bool HasPassword,
    DateTime CreatedAt,
    DateTime? LastLoginAt);

public record UpdateProfileRequest(
    [Required, StringLength(80)] string FirstName,
    [Required, StringLength(80)] string LastName,
    [Required, StringLength(30)] string Phone,
    [StringLength(5)] string? PreferredLanguage);

public record CustomerAddressDto(
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

public record UpsertAddressRequest(
    [Required, StringLength(200)] string FullName,
    [Required, StringLength(30)] string Phone,
    [Required, StringLength(250)] string Street,
    [StringLength(250)] string? StreetComplement,
    [Required, StringLength(120)] string City,
    [StringLength(120)] string? Region,
    [StringLength(20)] string? PostalCode,
    [Required, StringLength(2, MinimumLength = 2)] string CountryCode,
    bool IsDefault = false);
