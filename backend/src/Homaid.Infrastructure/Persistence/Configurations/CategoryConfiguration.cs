using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.ToTable("categories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Slug).IsRequired().HasMaxLength(150);
        b.Property(x => x.ImageUrl).HasMaxLength(500);

        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.ParentId);
        b.HasIndex(x => x.IsActive);

        b.HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CategoryTranslationConfiguration : IEntityTypeConfiguration<CategoryTranslation>
{
    public void Configure(EntityTypeBuilder<CategoryTranslation> b)
    {
        b.ToTable("category_translations");
        b.HasKey(x => x.Id);
        b.Property(x => x.LanguageCode).IsRequired().HasMaxLength(5);
        b.Property(x => x.Name).IsRequired().HasMaxLength(200);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.MetaTitle).HasMaxLength(200);
        b.Property(x => x.MetaDescription).HasMaxLength(500);

        b.HasIndex(x => new { x.CategoryId, x.LanguageCode }).IsUnique();

        b.HasOne(x => x.Category)
            .WithMany(x => x.Translations)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
