namespace Homaid.Domain.Common;

public static class LanguageCodes
{
    public const string French = "fr";
    public const string Arabic = "ar";
    public const string English = "en";

    public const string Default = French;

    public static readonly IReadOnlyList<string> Supported = new[] { French, Arabic, English };

    public static bool IsSupported(string code) =>
        !string.IsNullOrWhiteSpace(code) && Supported.Contains(code.ToLowerInvariant());
}
