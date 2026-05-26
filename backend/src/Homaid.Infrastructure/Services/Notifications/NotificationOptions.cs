namespace Homaid.Infrastructure.Services.Notifications;

public class EmailOptions
{
    public const string Section = "Email";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "no-reply@homaid.local";
    public string FromName { get; set; } = "Homaid Store";
    public bool UseSsl { get; set; } = true;
    public bool Enabled => !string.IsNullOrWhiteSpace(SmtpHost);
}

public class WebPushOptions
{
    public const string Section = "WebPush";
    public string Subject { get; set; } = "mailto:admin@homaid.local";
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public bool Enabled => !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(PrivateKey);
}

public class StoreOptions
{
    public const string Section = "Store";
    public string DefaultCurrency { get; set; } = "MAD";
    public string DefaultLanguage { get; set; } = "fr";
    public decimal TvaPercent { get; set; } = 20m;
    public string AdminEmail { get; set; } = "admin@homaid.local";
    public string FrontUrl { get; set; } = "http://localhost:4200";
}
