using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class ShippingZoneConfiguration : IEntityTypeConfiguration<ShippingZone>
{
    public void Configure(EntityTypeBuilder<ShippingZone> b)
    {
        b.ToTable("shipping_zones");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(120);
        b.Property(x => x.Code).IsRequired().HasMaxLength(40);
        b.Property(x => x.CountryCodes).HasColumnType("text[]");
        b.HasIndex(x => x.Code).IsUnique();
    }
}

public class ShippingMethodConfiguration : IEntityTypeConfiguration<ShippingMethod>
{
    public void Configure(EntityTypeBuilder<ShippingMethod> b)
    {
        b.ToTable("shipping_methods");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(150);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.BaseFee).HasColumnType("numeric(12,2)");
        b.Property(x => x.FreeShippingThreshold).HasColumnType("numeric(12,2)");

        b.HasIndex(x => x.ZoneId);

        b.HasOne(x => x.Zone)
            .WithMany(x => x.Methods)
            .HasForeignKey(x => x.ZoneId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
