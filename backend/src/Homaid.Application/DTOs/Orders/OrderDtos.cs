using System.ComponentModel.DataAnnotations;
using Homaid.Domain.Enums;

namespace Homaid.Application.DTOs.Orders;

public record PlaceOrderItemDto(
    [Required] Guid ProductId,
    [Range(1, 1000)] int Quantity);

public record ShippingAddressDto(
    [Required, StringLength(200)] string FullName,
    [Required, StringLength(30)] string Phone,
    [Required, StringLength(250)] string Street,
    string? StreetComplement,
    [Required, StringLength(120)] string City,
    string? Region,
    string? PostalCode,
    [Required, StringLength(2, MinimumLength = 2)] string CountryCode);

public record PlaceOrderRequest(
    [Required, MinLength(1)] List<PlaceOrderItemDto> Items,
    [Required] ShippingAddressDto ShippingAddress,
    [Required] Guid ShippingMethodId,
    PaymentMethod? PaymentMethod,
    string? CustomerNotes,
    [EmailAddress, StringLength(180)] string? GuestEmail,
    [StringLength(30)] string? GuestPhone,
    [StringLength(80)] string? GuestFirstName,
    [StringLength(80)] string? GuestLastName);

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductSku,
    string ProductName,
    string? ProductImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public record OrderStatusHistoryDto(
    OrderStatus FromStatus,
    OrderStatus ToStatus,
    string? Notes,
    string? ChangedBy,
    DateTime ChangedAt);

public record OrderListDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    PaymentMethod PaymentMethod,
    decimal Total,
    string Currency,
    int ItemCount,
    string CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,
    string ShippingCity,
    string ShippingCountryCode,
    DateTime CreatedAt);

public record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    PaymentMethod PaymentMethod,

    Guid? CustomerId,
    string CustomerFullName,
    string CustomerEmail,
    string CustomerPhone,

    ShippingAddressDto ShippingAddress,
    Guid? ShippingMethodId,
    string? ShippingMethodName,

    decimal Subtotal,
    decimal ShippingFee,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal Total,
    string Currency,

    string? CustomerNotes,
    string? InternalNotes,
    string? BankTransferReference,
    DateTime? PaymentReceivedAt,
    DateTime? ConfirmedAt,
    DateTime? ShippedAt,
    DateTime? DeliveredAt,
    DateTime? CancelledAt,
    string? CancellationReason,

    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<OrderItemDto> Items,
    IReadOnlyList<OrderStatusHistoryDto> StatusHistory);

public record UpdateOrderStatusRequest(OrderStatus Status, string? Notes);
public record UpdatePaymentStatusRequest(PaymentStatus PaymentStatus, string? Reference);
public record CancelOrderRequest(string? Reason);
public record AdminOrderNotesRequest(string? InternalNotes);
public record AdminOrdersQuery(
    string? Search = null,
    OrderStatus? Status = null,
    PaymentStatus? PaymentStatus = null,
    DateTime? From = null,
    DateTime? To = null,
    int Page = 1,
    int PageSize = 20);
