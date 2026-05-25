using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class AdminConfiguration : IEntityTypeConfiguration<Admin>
{
    public void Configure(EntityTypeBuilder<Admin> b)
    {
        b.ToTable("admins");
        b.HasKey(x => x.Id);
        b.Property(x => x.Email).IsRequired().HasMaxLength(180);
        b.Property(x => x.PasswordHash).IsRequired().HasMaxLength(200);
        b.Property(x => x.FullName).IsRequired().HasMaxLength(150);
        b.Property(x => x.PreferredLanguage).IsRequired().HasMaxLength(5);
        b.Property(x => x.LastLoginIp).HasMaxLength(45);

        b.HasIndex(x => x.Email).IsUnique();
        b.HasIndex(x => x.IsActive);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens");
        b.HasKey(x => x.Id);

        b.Property(x => x.TokenHash).IsRequired().HasMaxLength(200);
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(200);
        b.Property(x => x.RevokedReason).HasMaxLength(250);
        b.Property(x => x.IpAddress).HasMaxLength(45);
        b.Property(x => x.UserAgent).HasMaxLength(500);

        b.Ignore(x => x.IsActive);

        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.CustomerId);
        b.HasIndex(x => x.AdminId);
        b.HasIndex(x => x.ExpiresAt);

        b.HasOne(x => x.Customer)
            .WithMany(x => x.RefreshTokens)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Admin)
            .WithMany(x => x.RefreshTokens)
            .HasForeignKey(x => x.AdminId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
