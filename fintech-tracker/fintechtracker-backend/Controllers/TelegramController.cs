using Microsoft.AspNetCore.Mvc;
using Telegram.Bot.Types;
using fintechtracker_backend.Services.Interfaces;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TelegramController : ControllerBase
    {
        private readonly ITelegramService _telegramService;
        private readonly ILogger<TelegramController> _logger;
        private readonly IConfiguration _configuration;

        public TelegramController(
            ITelegramService telegramService,
            ILogger<TelegramController> logger,
            IConfiguration configuration)
        {
            _telegramService = telegramService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook([FromBody] Update update)
        {
            try
            {
                // Validate Telegram signature
                var secretToken = _configuration["Telegram:SecretToken"];
                var receivedToken = Request.Headers["X-Telegram-Bot-Api-Secret-Token"].FirstOrDefault();

                if (secretToken != receivedToken)
                {
                    return Unauthorized();
                }

                if (update.Message is { } message && message.Text is { } messageText && message.From is { } from)
                {
                    var response = await _telegramService.ProcessMessageAsync(
                        from.Id,
                        messageText
                    );

                    await _telegramService.SendMessageAsync(message.Chat.Id, response);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook");
                return StatusCode(500);
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterTelegramRequest request)
        {
            try
            {
                // TODO: Validate token and get user info

                var success = await _telegramService.RegisterUserAsync(
                    request.TelegramUserId,
                    request.UserId,
                    request.ChatId,
                    request.FirstName,
                    request.LastName,
                    request.Username
                );

                return Ok(new { success, message = success ? "Registered successfully" : "Registration failed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user");
                return StatusCode(500);
            }
        }

        [HttpGet("status/{telegramUserId}")]
        public async Task<IActionResult> GetStatus(long telegramUserId)
        {
            var exists = await _telegramService.CheckUserExistsAsync(telegramUserId);
            var user = exists ? await _telegramService.GetTelegramUserAsync(telegramUserId) : null;

            return Ok(new
            {
                is_linked = exists,
                user_id = user?.UserId
            });
        }
    }

    public class RegisterTelegramRequest
    {
        public long TelegramUserId { get; set; }
        public int UserId { get; set; }
        public long ChatId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }
    }
}