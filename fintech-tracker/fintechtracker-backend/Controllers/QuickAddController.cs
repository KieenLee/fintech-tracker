using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Services;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class QuickAddController : ControllerBase
    {
        private readonly IQuickAddService _quickAddService;
        private readonly ILogger<QuickAddController> _logger;

        public QuickAddController(
            IQuickAddService quickAddService,
            ILogger<QuickAddController> logger)
        {
            _quickAddService = quickAddService;
            _logger = logger;
        }

        [HttpPost("process")]
        public async Task<ActionResult<QuickAddResponseDto>> ProcessMessage([FromBody] QuickAddRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message is required" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            _logger.LogInformation("Processing QuickAdd message for user {UserId}: {Message}", userId, request.Message);

            var response = await _quickAddService.ProcessMessageAsync(userId, request);

            return Ok(response);
        }
    }
}