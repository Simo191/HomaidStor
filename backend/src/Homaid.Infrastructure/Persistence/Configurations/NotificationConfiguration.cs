using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).IsRequired().HasMaxLength(200);
        b.Property(x => x.Body).IsRequired().HasMaxLength(2000);
        b.Property(x => x.PayloadJson).HasColumnType("jsonb");
        b.Property(x => x.FailureReason).HasMaxLength(500);

        b.HasIndex(x => new { x.RecipientType, x.RecipientId, x.IsRead });
        b.HasIndex(x => x.CreatedAt);
    }
}

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> b)
    {
        b.ToTable("push_subscriptions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Endpoint).IsRequired().HasMaxLength(500);
        b.Property(x => x.P256dh).IsRequired().HasMaxLength(200);
        b.Property(x => x.Auth).IsRequired().HasMaxLength(200);
        b.Property(x => x.UserAgent).HasMaxLength(500);

        b.HasIndex(x => x.Endpoint).IsUnique();
        b.HasIndex(x => x.CustomerId);
        b.HasIndex(x => x.AdminId);

        b.HasOne(x => x.Customer)
            .WithMany(x => x.PushSubscriptions)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Admin)
            .WithMany(x => x.PushSubscriptions)
            .HasForeignKey(x => x.AdminId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
