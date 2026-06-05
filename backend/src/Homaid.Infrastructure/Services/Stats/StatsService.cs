using Homaid.Application.DTOs.Stats;
using Homaid.Application.Interfaces.Stats;
using Homaid.Domain.Common;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Stats;

public class StatsService : IStatsService
{
    private readonly HomaidDbContext _db;
    public StatsService(HomaidDbContext db) => _db = db;

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(int days = 30, int topCount = 8, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-Math.Clamp(days, 1, 365));
        var monthsCutoff = DateTime.UtcNow.AddMonths(-12);

        // ============ TOP PRODUITS (par quantité vendue) ============
        var topProducts = await _db.OrderItems
            .AsNoTracking()
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled
                      && oi.Order.Status != OrderStatus.Refunded
                      && oi.Order.CreatedAt >= cutoff)
            .GroupBy(oi => new {
                oi.ProductId,
                oi.ProductSku,
                oi.ProductNameSnapshot,
                oi.ProductImageSnapshot
            })
            .Select(g => new TopProductDto(
                g.Key.ProductId,
                g.Key.ProductSku,
                g.Key.ProductNameSnapshot,
                g.Key.ProductImageSnapshot,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.LineTotal)))
            .OrderByDescending(p => p.QuantitySold)
            .Take(Math.Clamp(topCount, 1, 50))
            .ToListAsync(ct);

        // ============ TOP CATÉGORIES (par revenu) ============
        var topCatsRaw = await _db.OrderItems
            .AsNoTracking()
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled
                      && oi.Order.Status != OrderStatus.Refunded
                      && oi.Order.CreatedAt >= cutoff)
            .GroupBy(oi => oi.Product.CategoryId)
            .Select(g => new {
                CategoryId = g.Key,
                Quantity = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.LineTotal)
            })
            .OrderByDescending(g => g.Revenue)
            .Take(5)
            .ToListAsync(ct);

        var categoryIds = topCatsRaw.Select(c => c.CategoryId).ToList();
        var categoryInfo = await _db.Categories
            .AsNoTracking()
            .Where(c => categoryIds.Contains(c.Id))
            .Select(c => new {
                c.Id,
                c.Slug,
                Name = c.Translations.Where(t => t.LanguageCode == LanguageCodes.Default)
                    .Select(t => t.Name).FirstOrDefault()
                    ?? c.Translations.Select(t => t.Name).FirstOrDefault()
                    ?? c.Slug
            })
            .ToListAsync(ct);

        var topCategories = topCatsRaw
            .Select(c => {
                var info = categoryInfo.FirstOrDefault(x => x.Id == c.CategoryId);
                return new TopCategoryDto(
                    c.CategoryId,
                    info?.Slug ?? string.Empty,
                    info?.Name ?? string.Empty,
                    c.Quantity,
                    c.Revenue);
            })
            .ToList();

        // ============ REVENU MENSUEL (12 derniers mois) ============
        var monthlyRaw = await _db.Orders
            .AsNoTracking()
            .Where(o => o.Status != OrderStatus.Cancelled
                     && o.Status != OrderStatus.Refunded
                     && o.CreatedAt >= monthsCutoff)
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => new MonthlyRevenueDto(
                g.Key.Year, g.Key.Month,
                g.Sum(o => o.Total),
                g.Count()))
            .ToListAsync(ct);

        // Compléter les mois manquants (revenu = 0)
        var monthlyComplete = new List<MonthlyRevenueDto>();
        var now = DateTime.UtcNow;
        for (int i = 11; i >= 0; i--)
        {
            var d = now.AddMonths(-i);
            var match = monthlyRaw.FirstOrDefault(m => m.Year == d.Year && m.Month == d.Month);
            monthlyComplete.Add(match ?? new MonthlyRevenueDto(d.Year, d.Month, 0m, 0));
        }

        return new DashboardStatsDto(topProducts, topCategories, monthlyComplete);
    }
}
