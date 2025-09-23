using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace fintechtracker_backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public string GenerateOtpCode()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        public async Task<bool> SendOtpEmailAsync(string email, string otpCode, string firstName)
        {
            try
            {
                var emailSettings = _config.GetSection("EmailSettings");

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    emailSettings["SenderName"],
                    emailSettings["SenderEmail"]
                ));
                message.To.Add(new MailboxAddress("", email));
                message.Subject = "Email Verification - FinanceTracker";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = CreateOtpEmailTemplate(firstName, otpCode)
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(
                    emailSettings["SmtpServer"],
                    int.Parse(emailSettings["SmtpPort"] ?? throw new InvalidOperationException("SmtpPort configuration is missing")),
                    MailKit.Security.SecureSocketOptions.StartTls
                );

                await client.AuthenticateAsync(
                    emailSettings["SenderEmail"],
                    emailSettings["SenderPassword"]
                );

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"OTP email sent successfully to {email}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send OTP email to {email}: {ex.Message}");
                return false;
            }
        }

        private string CreateOtpEmailTemplate(string firstName, string otpCode)
        {
            return $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>Email Verification</title>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 28px;'>📧 Email Verification</h1>
                    </div>
                    
                    <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                        <h2 style='color: #495057; margin-top: 0;'>Hello {firstName}!</h2>
                        
                        <p style='font-size: 16px; margin-bottom: 25px;'>
                            Welcome to <strong>FinanceTracker</strong>! To complete your registration, please verify your email address using the verification code below:
                        </p>
                        
                        <div style='background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;'>
                            <p style='margin: 0 0 10px 0; font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px;'>Verification Code</p>
                            <h1 style='font-size: 36px; color: #667eea; margin: 0; letter-spacing: 8px; font-family: monospace;'>{otpCode}</h1>
                        </div>
                        
                        <div style='background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;'>
                            <p style='margin: 0; color: #856404; font-size: 14px;'>
                                ⚠️ <strong>Important:</strong> This code expires in <strong>5 minutes</strong> and can only be used once.
                            </p>
                        </div>
                        
                        <p style='font-size: 14px; color: #6c757d; margin-top: 30px;'>
                            If you didn't request this verification, please ignore this email or contact our support team.
                        </p>
                        
                        <hr style='border: none; border-top: 1px solid #e9ecef; margin: 30px 0;'>
                        
                        <div style='text-align: center; color: #6c757d; font-size: 12px;'>
                            <p>© 2025 FinanceTracker. All rights reserved.</p>
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>";
        }
    }
}