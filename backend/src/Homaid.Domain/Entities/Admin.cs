using Homaid.Domain.Common;
using Homaid.Domain.Enums;

namespace Homaid.Domain.Entities;

public class Admin : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public AdminRole Role { get; set; } = AdminRole.Manager;
    public bool IsActive { get; set; } = true;
    public string PreferredLanguage { get; set; } = LanguageCodes.Default;
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<PushSubscription> PushSubscriptions { get; set; } = new List<PushSubscription>();
}
