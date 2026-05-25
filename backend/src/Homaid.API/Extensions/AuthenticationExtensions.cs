using System.Text;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Homaid.API.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddHomaidAuth(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.Section));
        var jwt = config.GetSection(JwtOptions.Section).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt section missing.");

        var keyBytes = Encoding.UTF8.GetBytes(jwt.SigningKey);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorization(opt =>
        {
            opt.AddPolicy(AuthConstants.PolicyAdmin, p =>
                p.RequireAuthenticatedUser()
                 .RequireClaim(AuthConstants.PrincipalTypeClaim, AuthConstants.PrincipalAdmin));

            opt.AddPolicy(AuthConstants.PolicyCustomer, p =>
                p.RequireAuthenticatedUser()
                 .RequireClaim(AuthConstants.PrincipalTypeClaim, AuthConstants.PrincipalCustomer));

            opt.AddPolicy(AuthConstants.PolicySuperAdmin, p =>
                p.RequireAuthenticatedUser()
                 .RequireClaim(AuthConstants.PrincipalTypeClaim, AuthConstants.PrincipalAdmin)
                 .RequireRole("SuperAdmin"));
        });

        return services;
    }
}
