using Homaid.Application.Common;
using Homaid.Application.DTOs.Auth;

namespace Homaid.Application.Interfaces.Auth;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterCustomerAsync(RegisterCustomerRequest request, CancellationToken ct = default);
    Task<Result<AuthResponse>> LoginCustomerAsync(LoginRequest request, CancellationToken ct = default);
    Task<Result<AuthResponse>> LoginAdminAsync(LoginRequest request, CancellationToken ct = default);
    Task<Result<AuthResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task<Result> LogoutAsync(string refreshToken, CancellationToken ct = default);
}
