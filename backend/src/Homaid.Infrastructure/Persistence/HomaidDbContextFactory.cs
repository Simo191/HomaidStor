using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.Configuration.EnvironmentVariables;

namespace Homaid.Infrastructure.Persistence;

public class HomaidDbContextFactory : IDesignTimeDbContextFactory<HomaidDbContext>
{
    public HomaidDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Homaid.API");
        if (!File.Exists(Path.Combine(basePath, "appsettings.json")))
            basePath = Directory.GetCurrentDirectory();

        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("Default")
            ?? "Host=localhost;Port=5432;Database=storeproduct;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<HomaidDbContext>()
            .UseNpgsql(connectionString, npg =>
            {
                npg.MigrationsAssembly(typeof(HomaidDbContext).Assembly.GetName().Name);
            })
            .Options;

        return new HomaidDbContext(options);
    }
}
