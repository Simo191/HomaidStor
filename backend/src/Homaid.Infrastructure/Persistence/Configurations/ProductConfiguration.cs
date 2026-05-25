using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("products");
        b.HasKey(x => x.Id);

        b.Property(x => x.Sku).IsRequired().HasMaxLength(60);
        b.Property(x => x.Slug).IsRequired().HasMaxLength(200);
        b.Property(x => x.Currency).IsRequired().HasMaxLength(3);
        b.Property(x => x.Barcode).HasMaxLength(60);

        b.Property(x => x.BasePrice).HasColumnType("numeric(12,2)");
        b.Property(x => x.CompareAtPrice).HasColumnType("numeric(12,2)");
        b.Property(x => x.WeightKg).HasColumnType("numeric(8,3)");

        b.Property(x => x.Attributes).HasColumnType("jsonb");

        b.HasIndex(x => x.Sku).IsUnique();
        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.CategoryId);
        b.HasIndex(x => x.BrandId);
        b.HasIndex(x => x.IsActive);
        b.HasIndex(x => x.IsFeatured);
        b.HasIndex(x => x.PublishedAt);

        b.HasOne(x => x.Category)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Brand)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.BrandId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ProductTranslationConfiguration : IEntityTypeConfiguration<ProductTranslation>
{
    public void Configure(EntityTypeBuilder<ProductTranslation> b)
    {
        b.ToTable("product_translations");
        b.HasKey(x => x.Id);
        b.Property(x => x.LanguageCode).IsRequired().HasMaxLength(5);
        b.Property(x => x.Name).IsRequired().HasMaxLength(250);
        b.Property(x => x.ShortDescription).HasMaxLength(500);
        b.Property(x => x.Description).HasColumnType("text");
        b.Property(x => x.MetaTitle).HasMaxLength(200);
        b.Property(x => x.MetaDescription).HasMaxLength(500);

        b.HasIndex(x => new { x.ProductId, x.LanguageCode }).IsUnique();
        b.HasIndex(x => x.Name);

        b.HasOne(x => x.Product)
            .WithMany(x => x.Translations)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> b)
    {
        b.ToTable("product_images");
        b.HasKey(x => x.Id);
        b.Property(x => x.Url).IsRequired().HasMaxLength(500);
        b.Property(x => x.AltText).HasMaxLength(250);

        b.HasIndex(x => x.ProductId);

        b.HasOne(x => x.Product)
            .WithMany(x => x.Images)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
