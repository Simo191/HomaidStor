using System.Text.Json;
using Homaid.Domain.Common;

namespace Homaid.Domain.Entities;

public class Product : AuditableEntity
{
    public string Sku { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }
    public Guid? BrandId { get; set; }

    public decimal BasePrice { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string Currency { get; set; } = "MAD";

    public int StockQuantity { get; set; }
    public int LowStockThreshold { get; set; } = 5;

    public decimal? WeightKg { get; set; }
    public string? Barcode { get; set; }

    public JsonDocument? Attributes { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    public int ViewCount { get; set; }
    public DateTime? PublishedAt { get; set; }

    public Category Category { get; set; } = null!;
    public Brand? Brand { get; set; }
    public ICollection<ProductTranslation> Translations { get; set; } = new List<ProductTranslation>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}

public class ProductTranslation : BaseEntity
{
    public Guid ProductId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }

    public Product Product { get; set; } = null!;
}

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }

    public Product Product { get; set; } = null!;
}
