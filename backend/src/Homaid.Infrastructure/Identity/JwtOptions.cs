namespace Homaid.Infrastructure.Identity;

public class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}

public static class AuthConstants
{
    public const string PrincipalTypeClaim = "principal_type";
    public const string PrincipalCustomer = "customer";
    public const string PrincipalAdmin = "admin";

    public const string PolicyAdmin = "AdminOnly";
    public const string PolicyCustomer = "CustomerOnly";
    public const string PolicySuperAdmin = "SuperAdminOnly";
}
