using Homaid.Application.Interfaces;
using Homaid.Domain.Common;

namespace Homaid.API.Services;

public class LanguageProvider : ILanguageProvider
{
    private readonly IHttpContextAccessor _accessor;

    public LanguageProvider(IHttpContextAccessor accessor) => _accessor = accessor;

    public string Current
    {
        get
        {
            var ctx = _accessor.HttpContext;
            if (ctx is null) return LanguageCodes.Default;

            var fromQuery = ctx.Request.Query["lang"].ToString();
            if (LanguageCodes.IsSupported(fromQuery)) return fromQuery.ToLowerInvariant();

            var header = ctx.Request.Headers["Accept-Language"].ToString();
            if (!string.IsNullOrWhiteSpace(header))
            {
                foreach (var part in header.Split(','))
                {
                    var code = part.Split(';')[0].Trim();
                    var primary = code.Split('-')[0].ToLowerInvariant();
                    if (LanguageCodes.IsSupported(primary)) return primary;
                }
            }
            return LanguageCodes.Default;
        }
    }
}
