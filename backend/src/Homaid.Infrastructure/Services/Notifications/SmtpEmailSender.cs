using Homaid.Application.Interfaces.Notifications;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Homaid.Infrastructure.Services.Notifications;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _opts;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> opts, ILogger<SmtpEmailSender> logger)
    {
        _opts = opts.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null, CancellationToken ct = default)
    {
        if (!_opts.Enabled)
        {
            _logger.LogInformation("Email sending disabled (no SmtpHost configured). Would send to {To}: {Subject}", toEmail, subject);
            return false;
        }

        try
        {
            var msg = new MimeMessage();
            msg.From.Add(new MailboxAddress(_opts.FromName, _opts.FromAddress));
            msg.To.Add(MailboxAddress.Parse(toEmail));
            msg.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody };
            if (!string.IsNullOrWhiteSpace(textBody)) builder.TextBody = textBody;
            msg.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var socketOptions = _opts.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
            await client.ConnectAsync(_opts.SmtpHost, _opts.SmtpPort, socketOptions, cts.Token);
            if (!string.IsNullOrWhiteSpace(_opts.Username))
                await client.AuthenticateAsync(_opts.Username, _opts.Password, cts.Token);

            await client.SendAsync(msg, cts.Token);
            await client.DisconnectAsync(true, cts.Token);

            _logger.LogInformation("Email sent to {To} ({Subject})", toEmail, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} ({Subject})", toEmail, subject);
            return false;
        }
    }
}
