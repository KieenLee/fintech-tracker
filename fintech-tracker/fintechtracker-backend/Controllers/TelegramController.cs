using Microsoft.AspNetCore.Mvc;
using fintechtracker_backend.Services;
using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TelegramController : ControllerBase
    {
        private readonly ITelegramService _telegramService;
        private readonly ILogger<TelegramController> _logger;

        public TelegramController(ITelegramService telegramService, ILogger<TelegramController> logger)
        {
            _telegramService = telegramService;
            _logger = logger;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook([FromBody] TelegramUpdateDto update)
        {
            try
            {
                if (update.Message?.Text == null)
                    return Ok();

                _logger.LogInformation($"Received message from {update.Message.From.Id}: {update.Message.Text}");

                var result = await _telegramService.ProcessMessageAsync(update.Message);
                
                if (result.ShouldRespond)
                {
                    await _telegramService.SendMessageAsync(update.Message.Chat.Id, result.ResponseMessage);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Telegram webhook");
                return StatusCode(500);
            }
        }

        [HttpPost("set-webhook")]
        public async Task<IActionResult> SetWebhook([FromBody] SetWebhookRequest request)
        {
            try
            {
                var success = await _telegramService.SetWebhookAsync(request.Url);
                return Ok(new { success });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting webhook");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}