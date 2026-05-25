using Homaid.Domain.Entities;

namespace Homaid.Application.Interfaces.Auth;

public record TokenPair(string AccessToken, string RefreshToken, DateTime AccessExpiresAt, DateTime RefreshExpiresAt);

public interface IJwtTokenService
{
    TokenPair GenerateForCustomer(Customer customer);
    TokenPair GenerateForAdmin(Admin admin);
    string HashRefreshToken(string rawToken);
}
