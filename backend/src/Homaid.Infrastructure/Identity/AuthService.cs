using Homaid.Application.Common;
using Homaid.Application.DTOs.Auth;
using Homaid.Application.Interfaces.Auth;
using Homaid.Domain.Common;
using Homaid.Domain.Entities;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly HomaidDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly ICurrentUser _current;

    public AuthService(HomaidDbContext db, IPasswordHasher hasher, IJwtTokenService jwt, ICurrentUser current)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _current = current;
    }

    public async Task<Result<AuthResponse>> RegisterCustomerAsync(RegisterCustomerRequest req, CancellationToken ct = default)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        if (await _db.Customers.AnyAsync(c => c.Email == email, ct))
            return Result.Failure<AuthResponse>(Error.Conflict("auth.email_taken", "Cet email est déjà utilisé."));

        var lang = LanguageCodes.IsSupported(req.PreferredLanguage ?? "") ? req.PreferredLanguage! : LanguageCodes.Default;

        var customer = new Customer
        {
            Email = email,
            Phone = req.Phone.Trim(),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            PasswordHash = _hasher.Hash(req.Password),
            AuthProvider = AuthProvider.Local,
            PreferredLanguage = lang,
            IsActive = true
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);

        return await IssueCustomerTokensAsync(customer, ct);
    }

    public async Task<Result<AuthResponse>> LoginCustomerAsync(LoginRequest req, CancellationToken ct = default)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email, ct);

        if (customer is null || !customer.IsActive ||
            customer.PasswordHash is null || !_hasher.Verify(req.Password, customer.PasswordHash))
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("auth.invalid_credentials", "Email ou mot de passe incorrect."));
        }

        customer.LastLoginAt = DateTime.UtcNow;
        return await IssueCustomerTokensAsync(customer, ct);
    }

    public async Task<Result<AuthResponse>> LoginAdminAsync(LoginRequest req, CancellationToken ct = default)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var admin = await _db.Admins.FirstOrDefaultAsync(a => a.Email == email, ct);

        if (admin is null || !admin.IsActive || !_hasher.Verify(req.Password, admin.PasswordHash))
            return Result.Failure<AuthResponse>(Error.Unauthorized("auth.invalid_credentials", "Email ou mot de passe incorrect."));

        admin.LastLoginAt = DateTime.UtcNow;
        admin.LastLoginIp = _current.IpAddress;

        return await IssueAdminTokensAsync(admin, ct);
    }

    public async Task<Result<AuthResponse>> RefreshAsync(RefreshTokenRequest req, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefreshToken(req.RefreshToken);
        var existing = await _db.RefreshTokens
            .Include(t => t.Customer)
            .Include(t => t.Admin)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (existing is null || existing.RevokedAt != null || existing.ExpiresAt <= DateTime.UtcNow)
            return Result.Failure<AuthResponse>(Error.Unauthorized("auth.invalid_refresh", "Refresh token invalide ou expiré."));

        existing.RevokedAt = DateTime.UtcNow;
        existing.RevokedReason = "rotated";

        if (existing.Customer is { IsActive: true } c)
            return await IssueCustomerTokensAsync(c, ct, existing);

        if (existing.Admin is { IsActive: true } a)
            return await IssueAdminTokensAsync(a, ct, existing);

        return Result.Failure<AuthResponse>(Error.Unauthorized("auth.invalid_refresh", "Compte inactif."));
    }

    public async Task<Result> LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefreshToken(refreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedReason = "logout";
            await _db.SaveChangesAsync(ct);
        }
        return Result.Success();
    }

    private async Task<Result<AuthResponse>> IssueCustomerTokensAsync(Customer c, CancellationToken ct, RefreshToken? rotated = null)
    {
        var pair = _jwt.GenerateForCustomer(c);
        var stored = new RefreshToken
        {
            CustomerId = c.Id,
            TokenHash = _jwt.HashRefreshToken(pair.RefreshToken),
            ExpiresAt = pair.RefreshExpiresAt,
            IpAddress = _current.IpAddress,
            UserAgent = _current.UserAgent
        };
        _db.RefreshTokens.Add(stored);
        if (rotated != null) rotated.ReplacedByTokenHash = stored.TokenHash;
        await _db.SaveChangesAsync(ct);

        var user = new AuthenticatedUserDto(
            c.Id, c.Email, $"{c.FirstName} {c.LastName}".Trim(),
            "Customer", AuthConstants.PrincipalCustomer, c.PreferredLanguage);

        return Result.Success(new AuthResponse(pair.AccessToken, pair.RefreshToken, pair.AccessExpiresAt, pair.RefreshExpiresAt, user));
    }

    private async Task<Result<AuthResponse>> IssueAdminTokensAsync(Admin a, CancellationToken ct, RefreshToken? rotated = null)
    {
        var pair = _jwt.GenerateForAdmin(a);
        var stored = new RefreshToken
        {
            AdminId = a.Id,
            TokenHash = _jwt.HashRefreshToken(pair.RefreshToken),
            ExpiresAt = pair.RefreshExpiresAt,
            IpAddress = _current.IpAddress,
            UserAgent = _current.UserAgent
        };
        _db.RefreshTokens.Add(stored);
        if (rotated != null) rotated.ReplacedByTokenHash = stored.TokenHash;
        await _db.SaveChangesAsync(ct);

        var user = new AuthenticatedUserDto(
            a.Id, a.Email, a.FullName,
            a.Role.ToString(), AuthConstants.PrincipalAdmin, a.PreferredLanguage);

        return Result.Success(new AuthResponse(pair.AccessToken, pair.RefreshToken, pair.AccessExpiresAt, pair.RefreshExpiresAt, user));
    }
}
