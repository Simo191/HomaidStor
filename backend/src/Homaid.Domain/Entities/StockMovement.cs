using Homaid.Domain.Common;
using Homaid.Domain.Enums;

namespace Homaid.Domain.Entities;

public class StockMovement : BaseEntity
{
    public Guid ProductId { get; set; }
    public StockMovementType MovementType { get; set; }
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string? Reason { get; set; }
    public Guid? OrderId { get; set; }
    public Guid? AdminId { get; set; }

    public Product Product { get; set; } = null!;
    public Order? Order { get; set; }
    public Admin? Admin { get; set; }
}
