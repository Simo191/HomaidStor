using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Homaid.Application.Interfaces.Auth;
using Homaid.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Homaid.Infrastructure.Identity;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _opts;
    private readonly SigningCredentials _credentials;

    public JwtTokenService(IOptions<JwtOptions> opts)
    {
        _opts = opts.Value;
        if (string.IsNullOrWhiteSpace(_opts.SigningKey) || _opts.SigningKey.Length < 32)
            throw new InvalidOperationException("Jwt:SigningKey must be at least 32 chars.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.SigningKey));
        _credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public TokenPair GenerateForCustomer(Customer c)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, c.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, c.Email),
            new(AuthConstants.PrincipalTypeClaim, AuthConstants.PrincipalCustomer),
            new(ClaimTypes.Name, $"{c.FirstName} {c.LastName}".Trim()),
            new(ClaimTypes.Role, "Customer")
        };
        return Build(claims);
    }

    public TokenPair GenerateForAdmin(Admin a)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, a.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, a.Email),
            new(AuthConstants.PrincipalTypeClaim, AuthConstants.PrincipalAdmin),
            new(ClaimTypes.Name, a.FullName),
            new(ClaimTypes.Role, a.Role.ToString())
        };
        return Build(claims);
    }

    public string HashRefreshToken(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToBase64String(hash);
    }

    private TokenPair Build(IList<Claim> claims)
    {
        var now = DateTime.UtcNow;
        var accessExpires = now.AddMinutes(_opts.AccessTokenMinutes);
        var refreshExpires = now.AddDays(_opts.RefreshTokenDays);

        claims.Add(new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()));
        claims.Add(new Claim(JwtRegisteredClaimNames.Iat, ((DateTimeOffset)now).ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture), ClaimValueTypes.Integer64));

        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            notBefore: now,
            expires: accessExpires,
            signingCredentials: _credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateSecureRandomToken();

        return new TokenPair(accessToken, refreshToken, accessExpires, refreshExpires);
    }

    private static string GenerateSecureRandomToken()
    {
        Span<byte> bytes = stackalloc byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
