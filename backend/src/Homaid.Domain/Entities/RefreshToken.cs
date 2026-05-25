using Homaid.Domain.Common;

namespace Homaid.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public Guid? CustomerId { get; set; }
    public Guid? AdminId { get; set; }

    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public string? RevokedReason { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public Customer? Customer { get; set; }
    public Admin? Admin { get; set; }

    public bool IsActive => RevokedAt == null && ExpiresAt > DateTime.UtcNow;
}
