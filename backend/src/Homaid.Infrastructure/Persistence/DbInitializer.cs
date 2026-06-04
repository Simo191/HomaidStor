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

        await SeedBrandsAndProductsAsync(db, ct);
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
        Category Make(string slug, int sort, (string fr, string ar, string en) names)
        {
            var c = new Category { Slug = slug, SortOrder = sort, IsActive = true };
            c.Translations.Add(new CategoryTranslation { LanguageCode = LanguageCodes.French,  Name = names.fr });
            c.Translations.Add(new CategoryTranslation { LanguageCode = LanguageCodes.Arabic,  Name = names.ar });
            c.Translations.Add(new CategoryTranslation { LanguageCode = LanguageCodes.English, Name = names.en });
            return c;
        }

        var targets = new[]
        {
            Make("cosmetique",    0, ("Cosmétique",   "مستحضرات التجميل",  "Cosmetics")),
            Make("skin-care",     1, ("Skin Care",    "العناية بالبشرة",   "Skin Care")),
            Make("k-beauty",      2, ("K-Beauty",     "جمال كوري",         "K-Beauty")),
            Make("parfums",       3, ("Parfums",      "عطور",              "Perfumes")),
            Make("sun-tan",       4, ("Sun & Tan",    "حماية شمسية",       "Sun & Tan")),
            Make("parapharmacie", 5, ("Parapharmacie","صيدلية",            "Parapharmacy")),
            Make("mini-size",     6, ("Mini Size",    "الأحجام الصغيرة",   "Mini Size")),
            Make("idees-cadeaux", 7, ("Idées Cadeaux","أفكار هدايا",       "Gift Ideas"))
        };

        var existingSlugs = await db.Categories.Select(c => c.Slug).ToListAsync(ct);
        foreach (var c in targets)
            if (!existingSlugs.Contains(c.Slug)) db.Categories.Add(c);
    }

    private static async Task SeedBrandsAndProductsAsync(HomaidDbContext db, CancellationToken ct)
    {
        if (await db.Products.AnyAsync(ct)) return;

        var samsung = new Brand { Name = "Samsung", Slug = "samsung", IsActive = true };
        var apple   = new Brand { Name = "Apple",   Slug = "apple",   IsActive = true };
        var nike    = new Brand { Name = "Nike",    Slug = "nike",    IsActive = true };
        db.Brands.AddRange(samsung, apple, nike);

        var electro = await db.Categories.FirstAsync(c => c.Slug == "electronique", ct);
        var vetements = await db.Categories.FirstAsync(c => c.Slug == "vetements", ct);
        var maison = await db.Categories.FirstAsync(c => c.Slug == "maison", ct);

        Product Make(string sku, string slug, Guid categoryId, Brand? brand, decimal price, int stock, bool featured,
                     (string fr, string ar, string en) name, (string fr, string ar, string en)? shortDesc = null)
        {
            var p = new Product
            {
                Sku = sku,
                Slug = slug,
                CategoryId = categoryId,
                BrandId = brand?.Id,
                Brand = brand,
                BasePrice = price,
                Currency = "MAD",
                StockQuantity = stock,
                LowStockThreshold = 5,
                IsActive = true,
                IsFeatured = featured,
                PublishedAt = DateTime.UtcNow
            };
            p.Translations.Add(new ProductTranslation { LanguageCode = "fr", Name = name.fr, ShortDescription = shortDesc?.fr });
            p.Translations.Add(new ProductTranslation { LanguageCode = "ar", Name = name.ar, ShortDescription = shortDesc?.ar });
            p.Translations.Add(new ProductTranslation { LanguageCode = "en", Name = name.en, ShortDescription = shortDesc?.en });
            p.Images.Add(new ProductImage { Url = $"https://picsum.photos/seed/{slug}/600/600", AltText = name.fr, IsPrimary = true, SortOrder = 0 });
            return p;
        }

        db.Products.AddRange(
            Make("ELEC-001", "iphone-15-pro", electro.Id, apple, 12999m, 8, true,
                ("iPhone 15 Pro", "آيفون 15 برو", "iPhone 15 Pro"),
                ("Smartphone Apple haut de gamme", "هاتف ذكي راقي من آبل", "Premium Apple smartphone")),

            Make("ELEC-002", "galaxy-s24", electro.Id, samsung, 9999m, 12, true,
                ("Samsung Galaxy S24", "سامسونغ غالاكسي S24", "Samsung Galaxy S24"),
                ("Smartphone Android performant", "هاتف أندرويد قوي", "Powerful Android smartphone")),

            Make("ELEC-003", "macbook-air-m3", electro.Id, apple, 18500m, 4, false,
                ("MacBook Air M3", "ماك بوك إير M3", "MacBook Air M3"),
                ("Ordinateur portable ultra fin", "حاسوب محمول رفيع", "Ultra-thin laptop")),

            Make("VET-001", "nike-air-max", vetements.Id, nike, 1299m, 25, true,
                ("Nike Air Max", "نايكي إير ماكس", "Nike Air Max"),
                ("Chaussures de sport iconiques", "أحذية رياضية أيقونية", "Iconic sports shoes")),

            Make("VET-002", "tshirt-coton-bio", vetements.Id, null, 199m, 100, false,
                ("T-shirt coton bio", "قميص قطن عضوي", "Organic cotton t-shirt"),
                ("100% coton biologique", "قطن عضوي 100%", "100% organic cotton")),

            Make("MAI-001", "lampe-design-led", maison.Id, null, 449m, 15, true,
                ("Lampe design LED", "مصباح LED تصميم", "LED design lamp"),
                ("Éclairage moderne pour salon", "إضاءة عصرية لغرفة المعيشة", "Modern living-room lighting"))
        );

        await Task.CompletedTask;
    }
}
