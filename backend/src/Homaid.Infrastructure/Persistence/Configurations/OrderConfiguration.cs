using Homaid.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Homaid.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("orders");
        b.HasKey(x => x.Id);

        b.Property(x => x.OrderNumber).IsRequired().HasMaxLength(30);
        b.Property(x => x.GuestEmail).HasMaxLength(180);
        b.Property(x => x.GuestPhone).HasMaxLength(30);
        b.Property(x => x.GuestFirstName).HasMaxLength(80);
        b.Property(x => x.GuestLastName).HasMaxLength(80);

        b.Property(x => x.ShippingFullName).IsRequired().HasMaxLength(200);
        b.Property(x => x.ShippingPhone).IsRequired().HasMaxLength(30);
        b.Property(x => x.ShippingStreet).IsRequired().HasMaxLength(250);
        b.Property(x => x.ShippingStreetComplement).HasMaxLength(250);
        b.Property(x => x.ShippingCity).IsRequired().HasMaxLength(120);
        b.Property(x => x.ShippingRegion).HasMaxLength(120);
        b.Property(x => x.ShippingPostalCode).HasMaxLength(20);
        b.Property(x => x.ShippingCountryCode).IsRequired().HasMaxLength(2);
        b.Property(x => x.ShippingMethodName).HasMaxLength(150);

        b.Property(x => x.Subtotal).HasColumnType("numeric(12,2)");
        b.Property(x => x.ShippingFee).HasColumnType("numeric(12,2)");
        b.Property(x => x.TaxAmount).HasColumnType("numeric(12,2)");
        b.Property(x => x.DiscountAmount).HasColumnType("numeric(12,2)");
        b.Property(x => x.Total).HasColumnType("numeric(12,2)");
        b.Property(x => x.Currency).IsRequired().HasMaxLength(3);

        b.Property(x => x.CustomerNotes).HasMaxLength(2000);
        b.Property(x => x.InternalNotes).HasMaxLength(2000);
        b.Property(x => x.BankTransferReference).HasMaxLength(150);
        b.Property(x => x.CancellationReason).HasMaxLength(500);

        b.HasIndex(x => x.OrderNumber).IsUnique();
        b.HasIndex(x => x.CustomerId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.PaymentStatus);
        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => x.GuestEmail);

        b.HasOne(x => x.Customer)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.ShippingMethod)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.ShippingMethodId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.ToTable("order_items");
        b.HasKey(x => x.Id);

        b.Property(x => x.ProductSku).IsRequired().HasMaxLength(60);
        b.Property(x => x.ProductNameSnapshot).IsRequired().HasMaxLength(250);
        b.Property(x => x.ProductImageSnapshot).HasMaxLength(500);
        b.Property(x => x.UnitPrice).HasColumnType("numeric(12,2)");
        b.Property(x => x.LineTotal).HasColumnType("numeric(12,2)");

        b.HasIndex(x => x.OrderId);
        b.HasIndex(x => x.ProductId);

        b.HasOne(x => x.Order)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Product)
            .WithMany(x => x.OrderItems)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> b)
    {
        b.ToTable("order_status_history");
        b.HasKey(x => x.Id);
        b.Property(x => x.Notes).HasMaxLength(1000);
        b.Property(x => x.ChangedBy).HasMaxLength(150);

        b.HasIndex(x => x.OrderId);

        b.HasOne(x => x.Order)
            .WithMany(x => x.StatusHistory)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
