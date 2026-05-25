using Homaid.Domain.Common;

namespace Homaid.Domain.Entities;

public class ShippingZone : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public List<string> CountryCodes { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<ShippingMethod> Methods { get; set; } = new List<ShippingMethod>();
}

public class ShippingMethod : AuditableEntity
{
    public Guid ZoneId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BaseFee { get; set; }
    public decimal? FreeShippingThreshold { get; set; }
    public int EstimatedMinDays { get; set; }
    public int EstimatedMaxDays { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ShippingZone Zone { get; set; } = null!;
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
