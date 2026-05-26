using Homaid.API.Common;
using Homaid.Application.DTOs.Auth;
using Homaid.Application.DTOs.Customers;
using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Customers;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers;

[ApiController]
[Authorize(Policy = AuthConstants.PolicyCustomer)]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly ICustomerService _customers;
    private readonly ICustomerAddressService _addresses;
    private readonly IAuthService _auth;
    private readonly ICurrentUser _current;

    public MeController(ICustomerService customers, ICustomerAddressService addresses, IAuthService auth, ICurrentUser current)
    {
        _customers = customers;
        _addresses = addresses;
        _auth = auth;
        _current = current;
    }

    private Guid CustomerId => _current.Id ?? Guid.Empty;

    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
        => (await _customers.GetProfileAsync(CustomerId, ct)).ToActionResult();

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req, CancellationToken ct)
        => (await _customers.UpdateProfileAsync(CustomerId, req, ct)).ToActionResult();

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
        => (await _auth.ChangePasswordAsync(CustomerId, req, ct)).ToActionResult();

    [HttpGet("addresses")]
    public async Task<IActionResult> ListAddresses(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(await _addresses.ListAsync(CustomerId, ct)));

    [HttpGet("addresses/{id:guid}")]
    public async Task<IActionResult> GetAddress(Guid id, CancellationToken ct)
        => (await _addresses.GetAsync(CustomerId, id, ct)).ToActionResult();

    [HttpPost("addresses")]
    public async Task<IActionResult> CreateAddress([FromBody] UpsertAddressRequest req, CancellationToken ct)
        => (await _addresses.CreateAsync(CustomerId, req, ct)).ToActionResult();

    [HttpPut("addresses/{id:guid}")]
    public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpsertAddressRequest req, CancellationToken ct)
        => (await _addresses.UpdateAsync(CustomerId, id, req, ct)).ToActionResult();

    [HttpDelete("addresses/{id:guid}")]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken ct)
        => (await _addresses.DeleteAsync(CustomerId, id, ct)).ToActionResult();

    [HttpPost("addresses/{id:guid}/default")]
    public async Task<IActionResult> SetDefault(Guid id, CancellationToken ct)
        => (await _addresses.SetDefaultAsync(CustomerId, id, ct)).ToActionResult();
}
