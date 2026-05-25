using System.Text.Json;
using Homaid.API.Common;
using Homaid.Application.Common;

namespace Homaid.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", ctx.Request.Method, ctx.Request.Path);
            ctx.Response.StatusCode = 500;
            ctx.Response.ContentType = "application/json";

            var message = _env.IsDevelopment() ? ex.Message : "Une erreur interne est survenue.";
            var body = ApiResponse<object>.Fail(new Error("server.unexpected", message, ErrorType.Unexpected));
            await ctx.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOpts));
        }
    }
}
