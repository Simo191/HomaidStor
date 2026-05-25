using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> b)
    {
        b.ToTable("brands");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(120);
        b.Property(x => x.Slug).IsRequired().HasMaxLength(150);
        b.Property(x => x.LogoUrl).HasMaxLength(500);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.IsActive);
    }
}
