using Homaid.Domain.Common;
using Homaid.Domain.Entities;
using Homaid.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Homaid.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(
        HomaidDbContext db,
        IConfiguration config,
        ILogger logger,
        CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        await SeedAdminAsync(db, config, logger, ct);
        await SeedShippingZonesAsync(db, ct);
        await SeedCategoriesAsync(db, ct);

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedAdminAsync(HomaidDbContext db, IConfiguration config, ILogger logger, CancellationToken ct)
    {
        if (await db.Admins.AnyAsync(ct)) return;

        var email = config["Store:AdminEmail"] ?? "admin@homaid.local";
        var defaultPassword = config["Store:AdminDefaultPassword"] ?? "ChangeMe!2026";

        var admin = new Admin
        {
            Email = email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword, workFactor: 12),
            FullName = "Super Admin",
            Role = AdminRole.SuperAdmin,
            IsActive = true,
            PreferredLanguage = LanguageCodes.Default
        };
        db.Admins.Add(admin);

        logger.LogWarning(
            "Default admin seeded: {Email} / password from configuration (Store:AdminDefaultPassword). CHANGE IT IMMEDIATELY.",
            email);
    }

    private static async Task SeedShippingZonesAsync(HomaidDbContext db, CancellationToken ct)
    {
        if (await db.ShippingZones.AnyAsync(ct)) return;

        var morocco = new ShippingZone
        {
            Name = "Maroc",
            Code = "MA",
            CountryCodes = new() { "MA" },
            IsActive = true,
            SortOrder = 0,
            Methods =
            {
                new ShippingMethod { Name = "Livraison standard", BaseFee = 30m, FreeShippingThreshold = 500m, EstimatedMinDays = 2, EstimatedMaxDays = 5, IsActive = true, SortOrder = 0 },
                new ShippingMethod { Name = "Livraison express", BaseFee = 60m, EstimatedMinDays = 1, EstimatedMaxDays = 2, IsActive = true, SortOrder = 1 }
            }
        };

        var international = new ShippingZone
        {
            Name = "International",
            Code = "INTL",
            CountryCodes = new() { "FR", "ES", "BE", "DE", "GB", "US", "CA" },
            IsActive = true,
            SortOrder = 1,
            Methods =
            {
                new ShippingMethod { Name = "International (virement préalable)", BaseFee = 250m, EstimatedMinDays = 5, EstimatedMaxDays = 14, IsActive = true, SortOrder = 0 }
            }
        };

        db.ShippingZones.AddRange(morocco, international);
    }

    private static async Task SeedCategoriesAsync(HomaidDbContext db, CancellationToken ct)
    {
        if (await db.Categories.AnyAsync(ct)) return;

        Category Make(string slug, int sort, (string fr, string ar, string en) names)
        {
            var c = new Category { Slug = slug, SortOrder = sort, IsActive = true };
            c.Translations.Add(new CategoryTranslation { LanguageCode = LanguageCodes.French,  Name = names.fr });
            c.Translations.Add(new CategoryTranslation { LanguageCode = LanguageCodes.Arabic,  Name = names.ar });
            c.Translations.Add(new CategoryTranslation { LanguageCode = LanguageCodes.English, Name = names.en });
            return c;
        }

        db.Categories.AddRange(
            Make("electronique", 0, ("Électronique", "إلكترونيات", "Electronics")),
            Make("vetements",    1, ("Vêtements",  "ملابس",     "Clothing")),
            Make("maison",       2, ("Maison",     "منزل",      "Home")),
            Make("alimentation", 3, ("Alimentation","أغذية",     "Groceries")),
            Make("beaute",       4, ("Beauté",     "تجميل",     "Beauty"))
        );
    }
}
