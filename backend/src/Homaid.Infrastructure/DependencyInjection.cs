using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Application.Interfaces.Orders;
using Homaid.Application.Interfaces.Shipping;
using Homaid.Infrastructure.Identity;
using Homaid.Infrastructure.Persistence;
using Homaid.Infrastructure.Services.Catalog;
using Homaid.Infrastructure.Services.Orders;
using Homaid.Infrastructure.Services.Shipping;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Homaid.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Missing connection string 'Default'.");

        services.AddDbContext<HomaidDbContext>(opt =>
            opt.UseNpgsql(connectionString, npg =>
            {
                npg.MigrationsAssembly(typeof(HomaidDbContext).Assembly.GetName().Name);
            }));

        services.AddMemoryCache();

        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped<IPublicCatalogService, PublicCatalogService>();
        services.AddScoped<ICategoryAdminService, CategoryAdminService>();
        services.AddScoped<IBrandAdminService, BrandAdminService>();
        services.AddScoped<IProductAdminService, ProductAdminService>();

        services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IShippingService, ShippingService>();

        return services;
    }
}
