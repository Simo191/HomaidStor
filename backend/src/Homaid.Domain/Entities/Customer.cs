using Homaid.Domain.Common;
using Homaid.Domain.Enums;

namespace Homaid.Domain.Entities;

public class Customer : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public string? PasswordHash { get; set; }

    public AuthProvider AuthProvider { get; set; } = AuthProvider.Local;
    public string? ExternalUserId { get; set; }

    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public bool IsActive { get; set; } = true;

    public string PreferredLanguage { get; set; } = LanguageCodes.Default;

    public DateTime? LastLoginAt { get; set; }

    public ICollection<Address> Addresses { get; set; } = new List<Address>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<PushSubscription> PushSubscriptions { get; set; } = new List<PushSubscription>();
}

public class Address : BaseEntity
{
    public Guid CustomerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string? StreetComplement { get; set; }
    public string City { get; set; } = string.Empty;
    public string? Region { get; set; }
    public string? PostalCode { get; set; }
    public string CountryCode { get; set; } = "MA";
    public bool IsDefault { get; set; }

    public Customer Customer { get; set; } = null!;
}
