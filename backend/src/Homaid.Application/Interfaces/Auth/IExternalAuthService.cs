using Homaid.Application.Common;

namespace Homaid.Application.Interfaces.Auth;

public record ExternalUserInfo(
    string Provider,
    string ExternalId,
    string Email,
    string FirstName,
    string LastName,
    bool EmailVerified);

public interface IExternalAuthService
{
    Task<Result<ExternalUserInfo>> VerifyGoogleAsync(string idToken, CancellationToken ct = default);
    Task<Result<ExternalUserInfo>> VerifyFacebookAsync(string accessToken, CancellationToken ct = default);
}
