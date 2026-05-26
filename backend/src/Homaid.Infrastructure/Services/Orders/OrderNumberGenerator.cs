using Homaid.Application.Interfaces.Orders;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Orders;

public class OrderNumberGenerator : IOrderNumberGenerator
{
    private readonly HomaidDbContext _db;
    public OrderNumberGenerator(HomaidDbContext db) => _db = db;

    public async Task<string> NextAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"HMD-{year}-";

        var lastSeq = await _db.Orders
            .AsNoTracking()
            .Where(o => o.OrderNumber.StartsWith(prefix))
            .Select(o => o.OrderNumber)
            .OrderByDescending(n => n)
            .FirstOrDefaultAsync(ct);

        var next = 1;
        if (lastSeq is not null)
        {
            var tail = lastSeq.Substring(prefix.Length);
            if (int.TryParse(tail, out var n)) next = n + 1;
        }
        return $"{prefix}{next:D5}";
    }
}
