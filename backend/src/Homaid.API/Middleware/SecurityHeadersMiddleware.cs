namespace Homaid.API.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        var h = ctx.Response.Headers;
        h["X-Content-Type-Options"] = "nosniff";
        h["X-Frame-Options"] = "DENY";
        h["Referrer-Policy"] = "strict-origin-when-cross-origin";
        h["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
        h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        h.Remove("Server");
        h.Remove("X-Powered-By");
        await _next(ctx);
    }
}
