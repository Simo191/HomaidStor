using Homaid.Application.Common;
using Homaid.Application.DTOs.Customers;
using Homaid.Application.Interfaces.Customers;
using Homaid.Domain.Common;
using Homaid.Domain.Entities;
using Homaid.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Homaid.Infrastructure.Services.Customers;

public class CustomerService : ICustomerService
{
    private readonly HomaidDbContext _db;
    public CustomerService(HomaidDbContext db) => _db = db;

    public async Task<Result<CustomerProfileDto>> GetProfileAsync(Guid customerId, CancellationToken ct = default)
    {
        var c = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == customerId, ct);
        if (c is null) return Result.Failure<CustomerProfileDto>(Error.NotFound("customer.not_found", "Compte introuvable."));
        return Result.Success(Map(c));
    }

    public async Task<Result<CustomerProfileDto>> UpdateProfileAsync(Guid customerId, UpdateProfileRequest req, CancellationToken ct = default)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(x => x.Id == customerId, ct);
        if (c is null) return Result.Failure<CustomerProfileDto>(Error.NotFound("customer.not_found", "Compte introuvable."));

        c.FirstName = req.FirstName.Trim();
        c.LastName = req.LastName.Trim();
        c.Phone = req.Phone.Trim();
        if (!string.IsNullOrWhiteSpace(req.PreferredLanguage) && LanguageCodes.IsSupported(req.PreferredLanguage))
            c.PreferredLanguage = req.PreferredLanguage.ToLowerInvariant();

        await _db.SaveChangesAsync(ct);
        return Result.Success(Map(c));
    }

    private static CustomerProfileDto Map(Domain.Entities.Customer c) => new(
        c.Id, c.Email, c.Phone, c.FirstName, c.LastName, c.PreferredLanguage,
        c.AuthProvider, c.EmailVerified, c.PhoneVerified, c.PasswordHash is not null,
        c.CreatedAt, c.LastLoginAt);
}

public class CustomerAddressService : ICustomerAddressService
{
    private readonly HomaidDbContext _db;
    public CustomerAddressService(HomaidDbContext db) => _db = db;

    public async Task<IReadOnlyList<CustomerAddressDto>> ListAsync(Guid customerId, CancellationToken ct = default)
    {
        return await _db.Addresses.AsNoTracking()
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt)
            .Select(a => Map(a))
            .ToListAsync(ct);
    }

    public async Task<Result<CustomerAddressDto>> GetAsync(Guid customerId, Guid addressId, CancellationToken ct = default)
    {
        var a = await _db.Addresses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == addressId && x.CustomerId == customerId, ct);
        return a is null
            ? Result.Failure<CustomerAddressDto>(Error.NotFound("address.not_found", "Adresse introuvable."))
            : Result.Success(Map(a));
    }

    public async Task<Result<CustomerAddressDto>> CreateAsync(Guid customerId, UpsertAddressRequest req, CancellationToken ct = default)
    {
        var hasAddresses = await _db.Addresses.AnyAsync(a => a.CustomerId == customerId, ct);

        if (req.IsDefault || !hasAddresses)
            await _db.Addresses.Where(a => a.CustomerId == customerId)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDefault, false), ct);

        var a = new Address
        {
            CustomerId = customerId,
            FullName = req.FullName.Trim(),
            Phone = req.Phone.Trim(),
            Street = req.Street.Trim(),
            StreetComplement = req.StreetComplement,
            City = req.City.Trim(),
            Region = req.Region,
            PostalCode = req.PostalCode,
            CountryCode = req.CountryCode.ToUpperInvariant(),
            IsDefault = req.IsDefault || !hasAddresses
        };
        _db.Addresses.Add(a);
        await _db.SaveChangesAsync(ct);
        return Result.Success(Map(a));
    }

    public async Task<Result<CustomerAddressDto>> UpdateAsync(Guid customerId, Guid addressId, UpsertAddressRequest req, CancellationToken ct = default)
    {
        var a = await _db.Addresses.FirstOrDefaultAsync(x => x.Id == addressId && x.CustomerId == customerId, ct);
        if (a is null) return Result.Failure<CustomerAddressDto>(Error.NotFound("address.not_found", "Adresse introuvable."));

        if (req.IsDefault && !a.IsDefault)
            await _db.Addresses.Where(x => x.CustomerId == customerId && x.Id != addressId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false), ct);

        a.FullName = req.FullName.Trim();
        a.Phone = req.Phone.Trim();
        a.Street = req.Street.Trim();
        a.StreetComplement = req.StreetComplement;
        a.City = req.City.Trim();
        a.Region = req.Region;
        a.PostalCode = req.PostalCode;
        a.CountryCode = req.CountryCode.ToUpperInvariant();
        a.IsDefault = req.IsDefault;

        await _db.SaveChangesAsync(ct);
        return Result.Success(Map(a));
    }

    public async Task<Result> DeleteAsync(Guid customerId, Guid addressId, CancellationToken ct = default)
    {
        var a = await _db.Addresses.FirstOrDefaultAsync(x => x.Id == addressId && x.CustomerId == customerId, ct);
        if (a is null) return Result.Failure(Error.NotFound("address.not_found", "Adresse introuvable."));
        var wasDefault = a.IsDefault;
        _db.Addresses.Remove(a);
        await _db.SaveChangesAsync(ct);

        if (wasDefault)
        {
            var fallback = await _db.Addresses.Where(x => x.CustomerId == customerId).OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(ct);
            if (fallback is not null) { fallback.IsDefault = true; await _db.SaveChangesAsync(ct); }
        }
        return Result.Success();
    }

    public async Task<Result> SetDefaultAsync(Guid customerId, Guid addressId, CancellationToken ct = default)
    {
        var a = await _db.Addresses.FirstOrDefaultAsync(x => x.Id == addressId && x.CustomerId == customerId, ct);
        if (a is null) return Result.Failure(Error.NotFound("address.not_found", "Adresse introuvable."));
        await _db.Addresses.Where(x => x.CustomerId == customerId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false), ct);
        a.IsDefault = true;
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }

    private static CustomerAddressDto Map(Address a) => new(
        a.Id, a.FullName, a.Phone, a.Street, a.StreetComplement,
        a.City, a.Region, a.PostalCode, a.CountryCode, a.IsDefault);
}
