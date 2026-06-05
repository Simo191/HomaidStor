using Homaid.Application.DTOs.Stats;

namespace Homaid.Application.Interfaces.Stats;

public interface IStatsService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync(int days = 30, int topCount = 8, CancellationToken ct = default);
}
