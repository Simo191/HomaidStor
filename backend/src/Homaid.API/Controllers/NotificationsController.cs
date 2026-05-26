using Homaid.API.Common;
using Homaid.Application.Common;
using Homaid.Application.DTOs.Notifications;
using Homaid.Application.Interfaces.Auth;
using Homaid.Application.Interfaces.Notifications;
using Homaid.Domain.Enums;
using Homaid.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homaid.API.Controllers;

[ApiController]
[Route("api")]
public class NotificationsController : ControllerBase
{
    private readonly IInAppNotificationService _inApp;
    private readonly IPushSubscriptionService _push;
    private readonly IPushNotificationSender _pushSender;
    private readonly ICurrentUser _current;

    public NotificationsController(
        IInAppNotificationService inApp,
        IPushSubscriptionService push,
        IPushNotificationSender pushSender,
        ICurrentUser current)
    {
        _inApp = inApp;
        _push = push;
        _pushSender = pushSender;
        _current = current;
    }

    [HttpGet("notifications/vapid-public-key")]
    [AllowAnonymous]
    public IActionResult VapidKey()
        => Ok(ApiResponse<object>.Ok(new VapidPublicKeyDto(_pushSender.GetVapidPublicKey())));

    // --- Customer endpoints ---
    [HttpGet("me/notifications")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CustomerList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool? unreadOnly = null, CancellationToken ct = default)
        => Ok(ApiResponse<object>.Ok(await _inApp.ListForCustomerAsync(_current.Id ?? Guid.Empty, new PageQuery(page, pageSize), unreadOnly, ct)));

    [HttpGet("me/notifications/unread-count")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CustomerUnreadCount(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(new UnreadCountDto(await _inApp.CountUnreadAsync(RecipientType.Customer, _current.Id ?? Guid.Empty, ct))));

    [HttpPatch("me/notifications/{id:guid}/read")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CustomerMarkRead(Guid id, CancellationToken ct)
        => (await _inApp.MarkReadAsync(id, RecipientType.Customer, _current.Id ?? Guid.Empty, ct)).ToActionResult();

    [HttpPost("me/notifications/read-all")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CustomerMarkAllRead(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(new { updated = await _inApp.MarkAllReadAsync(RecipientType.Customer, _current.Id ?? Guid.Empty, ct) }));

    [HttpPost("me/push-subscriptions")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CustomerSubscribePush([FromBody] PushSubscriptionRequest req, CancellationToken ct)
        => (await _push.SubscribeCustomerAsync(_current.Id ?? Guid.Empty, req, _current.UserAgent, ct)).ToActionResult();

    [HttpDelete("me/push-subscriptions")]
    [Authorize(Policy = AuthConstants.PolicyCustomer)]
    public async Task<IActionResult> CustomerUnsubscribePush([FromQuery] string endpoint, CancellationToken ct)
        => (await _push.UnsubscribeAsync(endpoint, ct)).ToActionResult();

    // --- Admin endpoints ---
    [HttpGet("admin/notifications")]
    [Authorize(Policy = AuthConstants.PolicyAdmin)]
    public async Task<IActionResult> AdminList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool? unreadOnly = null, CancellationToken ct = default)
        => Ok(ApiResponse<object>.Ok(await _inApp.ListForAdminAsync(_current.Id ?? Guid.Empty, new PageQuery(page, pageSize), unreadOnly, ct)));

    [HttpGet("admin/notifications/unread-count")]
    [Authorize(Policy = AuthConstants.PolicyAdmin)]
    public async Task<IActionResult> AdminUnreadCount(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(new UnreadCountDto(await _inApp.CountUnreadAsync(RecipientType.Admin, _current.Id ?? Guid.Empty, ct))));

    [HttpPatch("admin/notifications/{id:guid}/read")]
    [Authorize(Policy = AuthConstants.PolicyAdmin)]
    public async Task<IActionResult> AdminMarkRead(Guid id, CancellationToken ct)
        => (await _inApp.MarkReadAsync(id, RecipientType.Admin, _current.Id ?? Guid.Empty, ct)).ToActionResult();

    [HttpPost("admin/notifications/read-all")]
    [Authorize(Policy = AuthConstants.PolicyAdmin)]
    public async Task<IActionResult> AdminMarkAllRead(CancellationToken ct)
        => Ok(ApiResponse<object>.Ok(new { updated = await _inApp.MarkAllReadAsync(RecipientType.Admin, _current.Id ?? Guid.Empty, ct) }));

    [HttpPost("admin/push-subscriptions")]
    [Authorize(Policy = AuthConstants.PolicyAdmin)]
    public async Task<IActionResult> AdminSubscribePush([FromBody] PushSubscriptionRequest req, CancellationToken ct)
        => (await _push.SubscribeAdminAsync(_current.Id ?? Guid.Empty, req, _current.UserAgent, ct)).ToActionResult();

    [HttpDelete("admin/push-subscriptions")]
    [Authorize(Policy = AuthConstants.PolicyAdmin)]
    public async Task<IActionResult> AdminUnsubscribePush([FromQuery] string endpoint, CancellationToken ct)
        => (await _push.UnsubscribeAsync(endpoint, ct)).ToActionResult();
}
