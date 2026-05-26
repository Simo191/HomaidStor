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
    private readonly IExternalAuthService _external;

    public AuthService(HomaidDbContext db, IPasswordHasher hasher, IJwtTokenService jwt, ICurrentUser current, IExternalAuthService external)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _current = current;
        _external = external;
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

    public async Task<Result<AuthResponse>> LoginWithGoogleAsync(GoogleLoginRequest req, CancellationToken ct = default)
    {
        var verify = await _external.VerifyGoogleAsync(req.IdToken, ct);
        if (verify.IsFailure) return Result.Failure<AuthResponse>(verify.Error);
        return await UpsertExternalCustomerAsync(verify.Value, AuthProvider.Google, req.Phone, ct);
    }

    public async Task<Result<AuthResponse>> LoginWithFacebookAsync(FacebookLoginRequest req, CancellationToken ct = default)
    {
        var verify = await _external.VerifyFacebookAsync(req.AccessToken, ct);
        if (verify.IsFailure) return Result.Failure<AuthResponse>(verify.Error);
        return await UpsertExternalCustomerAsync(verify.Value, AuthProvider.Facebook, req.Phone, ct);
    }

    public async Task<Result> ChangePasswordAsync(Guid customerId, ChangePasswordRequest req, CancellationToken ct = default)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(x => x.Id == customerId, ct);
        if (c is null) return Result.Failure(Error.NotFound("customer.not_found", "Compte introuvable."));
        if (c.PasswordHash is null)
            return Result.Failure(Error.Validation("password.oauth_account", "Ce compte utilise un login externe (Google/Facebook). Définis un mot de passe via 'Mot de passe oublié' d'abord."));
        if (!_hasher.Verify(req.CurrentPassword, c.PasswordHash))
            return Result.Failure(Error.Unauthorized("password.wrong_current", "Mot de passe actuel incorrect."));
        c.PasswordHash = _hasher.Hash(req.NewPassword);
        await _db.RefreshTokens.Where(t => t.CustomerId == customerId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, DateTime.UtcNow).SetProperty(t => t.RevokedReason, "password_changed"), ct);
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }

    private async Task<Result<AuthResponse>> UpsertExternalCustomerAsync(ExternalUserInfo info, AuthProvider provider, string? phone, CancellationToken ct)
    {
        var existing = await _db.Customers.FirstOrDefaultAsync(c =>
            (c.AuthProvider == provider && c.ExternalUserId == info.ExternalId) || c.Email == info.Email, ct);

        if (existing is not null)
        {
            if (existing.AuthProvider == AuthProvider.Local && existing.PasswordHash is not null)
            {
                existing.AuthProvider = provider;
                existing.ExternalUserId = info.ExternalId;
            }
            else if (existing.AuthProvider != provider)
            {
                existing.AuthProvider = provider;
                existing.ExternalUserId = info.ExternalId;
            }
            if (info.EmailVerified) existing.EmailVerified = true;
            if (!string.IsNullOrWhiteSpace(phone) && string.IsNullOrWhiteSpace(existing.Phone))
                existing.Phone = phone;
            existing.LastLoginAt = DateTime.UtcNow;

            if (string.IsNullOrWhiteSpace(existing.Phone))
                return Result.Failure<AuthResponse>(Error.Validation("oauth.phone_required",
                    "Numéro de téléphone requis pour finaliser l'inscription."));

            return await IssueCustomerTokensAsync(existing, ct);
        }

        if (string.IsNullOrWhiteSpace(phone))
            return Result.Failure<AuthResponse>(Error.Validation("oauth.phone_required",
                "Premier login : numéro de téléphone requis."));

        var customer = new Customer
        {
            Email = info.Email,
            Phone = phone.Trim(),
            FirstName = string.IsNullOrWhiteSpace(info.FirstName) ? "Client" : info.FirstName,
            LastName = string.IsNullOrWhiteSpace(info.LastName) ? string.Empty : info.LastName,
            AuthProvider = provider,
            ExternalUserId = info.ExternalId,
            EmailVerified = info.EmailVerified,
            PasswordHash = null,
            IsActive = true,
            PreferredLanguage = LanguageCodes.Default,
            LastLoginAt = DateTime.UtcNow
        };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);
        return await IssueCustomerTokensAsync(customer, ct);
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
