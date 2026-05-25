using System.ComponentModel.DataAnnotations;

namespace Homaid.Application.DTOs.Auth;

public record RegisterCustomerRequest(
    [Required, EmailAddress, StringLength(180)] string Email,
    [Required, StringLength(30)] string Phone,
    [Required, StringLength(80)] string FirstName,
    [Required, StringLength(80)] string LastName,
    [Required, StringLength(100, MinimumLength = 8)] string Password,
    string? PreferredLanguage = null);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RefreshTokenRequest([Required] string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessExpiresAt,
    DateTime RefreshExpiresAt,
    AuthenticatedUserDto User);

public record AuthenticatedUserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    string PrincipalType,
    string PreferredLanguage);

public record OAuthLoginRequest(
    [Required] string Provider,
    [Required] string IdToken,
    string? Phone = null);
