using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> b)
    {
        b.ToTable("customers");
        b.HasKey(x => x.Id);

        b.Property(x => x.Email).IsRequired().HasMaxLength(180);
        b.Property(x => x.Phone).IsRequired().HasMaxLength(30);
        b.Property(x => x.FirstName).IsRequired().HasMaxLength(80);
        b.Property(x => x.LastName).IsRequired().HasMaxLength(80);
        b.Property(x => x.PasswordHash).HasMaxLength(200);
        b.Property(x => x.ExternalUserId).HasMaxLength(200);
        b.Property(x => x.PreferredLanguage).IsRequired().HasMaxLength(5);

        b.HasIndex(x => x.Email).IsUnique();
        b.HasIndex(x => x.Phone);
        b.HasIndex(x => new { x.AuthProvider, x.ExternalUserId });
        b.HasIndex(x => x.IsActive);
    }
}

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> b)
    {
        b.ToTable("addresses");
        b.HasKey(x => x.Id);
        b.Property(x => x.FullName).IsRequired().HasMaxLength(200);
        b.Property(x => x.Phone).IsRequired().HasMaxLength(30);
        b.Property(x => x.Street).IsRequired().HasMaxLength(250);
        b.Property(x => x.StreetComplement).HasMaxLength(250);
        b.Property(x => x.City).IsRequired().HasMaxLength(120);
        b.Property(x => x.Region).HasMaxLength(120);
        b.Property(x => x.PostalCode).HasMaxLength(20);
        b.Property(x => x.CountryCode).IsRequired().HasMaxLength(2);

        b.HasIndex(x => x.CustomerId);

        b.HasOne(x => x.Customer)
            .WithMany(x => x.Addresses)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
