using System.Net.Http.Json;
using System.Text.Json;
using Google.Apis.Auth;
using Homaid.Application.Common;
using Homaid.Application.Interfaces.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Homaid.Infrastructure.Identity;

public class ExternalAuthService : IExternalAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ExternalAuthService> _logger;

    public ExternalAuthService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<ExternalAuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<Result<ExternalUserInfo>> VerifyGoogleAsync(string idToken, CancellationToken ct = default)
    {
        var clientId = _config["OAuth:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return Result.Failure<ExternalUserInfo>(Error.Validation("oauth.google_not_configured", "Google OAuth non configuré (OAuth:Google:ClientId manquant)."));

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            if (string.IsNullOrWhiteSpace(payload.Email))
                return Result.Failure<ExternalUserInfo>(Error.Validation("oauth.no_email", "Google n'a pas retourné d'email."));

            return Result.Success(new ExternalUserInfo(
                Provider: "Google",
                ExternalId: payload.Subject,
                Email: payload.Email.ToLowerInvariant(),
                FirstName: payload.GivenName ?? string.Empty,
                LastName: payload.FamilyName ?? string.Empty,
                EmailVerified: payload.EmailVerified));
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID token");
            return Result.Failure<ExternalUserInfo>(Error.Unauthorized("oauth.invalid_token", "Token Google invalide ou expiré."));
        }
    }

    public async Task<Result<ExternalUserInfo>> VerifyFacebookAsync(string accessToken, CancellationToken ct = default)
    {
        var appId = _config["OAuth:Facebook:AppId"];
        var appSecret = _config["OAuth:Facebook:AppSecret"];
        if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(appSecret))
            return Result.Failure<ExternalUserInfo>(Error.Validation("oauth.facebook_not_configured", "Facebook OAuth non configuré."));

        var client = _httpClientFactory.CreateClient();

        var appAccessToken = $"{appId}|{appSecret}";
        var debugUrl = $"https://graph.facebook.com/debug_token?input_token={Uri.EscapeDataString(accessToken)}&access_token={Uri.EscapeDataString(appAccessToken)}";

        try
        {
            using var debugResp = await client.GetAsync(debugUrl, ct);
            if (!debugResp.IsSuccessStatusCode)
                return Result.Failure<ExternalUserInfo>(Error.Unauthorized("oauth.invalid_token", "Token Facebook invalide."));

            var debug = await debugResp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            if (!debug.TryGetProperty("data", out var data) ||
                !data.TryGetProperty("is_valid", out var isValid) ||
                !isValid.GetBoolean())
                return Result.Failure<ExternalUserInfo>(Error.Unauthorized("oauth.invalid_token", "Token Facebook invalide."));

            if (data.GetProperty("app_id").GetString() != appId)
                return Result.Failure<ExternalUserInfo>(Error.Unauthorized("oauth.wrong_app", "Token Facebook pour une autre app."));

            var meUrl = $"https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token={Uri.EscapeDataString(accessToken)}";
            using var meResp = await client.GetAsync(meUrl, ct);
            if (!meResp.IsSuccessStatusCode)
                return Result.Failure<ExternalUserInfo>(Error.Unauthorized("oauth.fetch_failed", "Impossible de récupérer le profil Facebook."));

            var me = await meResp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            var id = me.GetProperty("id").GetString() ?? string.Empty;
            var email = me.TryGetProperty("email", out var emailEl) ? emailEl.GetString() ?? string.Empty : string.Empty;
            var firstName = me.TryGetProperty("first_name", out var fEl) ? fEl.GetString() ?? string.Empty : string.Empty;
            var lastName = me.TryGetProperty("last_name", out var lEl) ? lEl.GetString() ?? string.Empty : string.Empty;

            if (string.IsNullOrWhiteSpace(email))
                return Result.Failure<ExternalUserInfo>(Error.Validation("oauth.no_email", "L'email Facebook est obligatoire. Autorise la permission email."));

            return Result.Success(new ExternalUserInfo("Facebook", id, email.ToLowerInvariant(), firstName, lastName, EmailVerified: true));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook OAuth verification failed");
            return Result.Failure<ExternalUserInfo>(Error.Unauthorized("oauth.fetch_failed", "Vérification Facebook a échoué."));
        }
    }
}
