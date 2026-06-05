using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Catalog;
using Homaid.Application.Interfaces.Customers;
using Homaid.Application.Interfaces.Notifications;
using Homaid.Application.Interfaces.Orders;
using Homaid.Application.Interfaces.Shipping;
using Homaid.Application.Interfaces.Stats;
using Homaid.Infrastructure.Identity;
using Homaid.Infrastructure.Persistence;
using Homaid.Infrastructure.Services.Catalog;
using Homaid.Infrastructure.Services.Customers;
using Homaid.Infrastructure.Services.Notifications;
using Homaid.Infrastructure.Services.Orders;
using Homaid.Infrastructure.Services.Shipping;
using Homaid.Infrastructure.Services.Stats;
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
        services.AddHttpClient();

        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IExternalAuthService, ExternalAuthService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ICustomerAddressService, CustomerAddressService>();
        services.AddScoped<ICustomerAdminService, CustomerAdminService>();

        services.AddScoped<IPublicCatalogService, PublicCatalogService>();
        services.AddScoped<ICategoryAdminService, CategoryAdminService>();
        services.AddScoped<IBrandAdminService, BrandAdminService>();
        services.AddScoped<IProductAdminService, ProductAdminService>();

        services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IShippingService, ShippingService>();
        services.AddScoped<IStatsService, StatsService>();

        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.Section));
        services.Configure<WebPushOptions>(configuration.GetSection(WebPushOptions.Section));
        services.Configure<StoreOptions>(configuration.GetSection(StoreOptions.Section));

        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IPushNotificationSender, WebPushSender>();
        services.AddScoped<IPushSubscriptionService, PushSubscriptionService>();
        services.AddScoped<IInAppNotificationService, InAppNotificationService>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }
}
