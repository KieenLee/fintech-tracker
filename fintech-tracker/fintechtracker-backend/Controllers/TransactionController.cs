using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Services;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpGet]
        public async Task<ActionResult<TransactionResponseDto>> GetTransactions([FromQuery] TransactionFilterDto filter)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var result = await _transactionService.GetUserTransactionsAsync(userId, filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving transactions", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TransactionDto>> GetTransaction(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var transaction = await _transactionService.GetTransactionByIdAsync(id, userId);
                if (transaction == null)
                {
                    return NotFound(new { message = "Transaction not found" });
                }
                return Ok(transaction);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving transaction", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var transaction = await _transactionService.CreateTransactionAsync(userId, dto);

                // Check for budget warnings if it's an expense
                BudgetWarningDto? budgetWarning = null;
                if (dto.TransactionType.ToLower() == "expense" && dto.CategoryId.HasValue)
                {
                    budgetWarning = await _transactionService.CheckBudgetAfterTransactionAsync(
                        userId, dto.CategoryId.Value, dto.Amount, dto.TransactionDate);
                }

                var response = new
                {
                    transaction,
                    budgetWarning
                };

                return CreatedAtAction(nameof(GetTransaction), new { id = transaction.TransactionId }, response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating transaction", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<object>> UpdateTransaction(int id, [FromBody] UpdateTransactionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                dto.TransactionId = id;
                var transaction = await _transactionService.UpdateTransactionAsync(id, userId, dto);

                if (transaction == null)
                {
                    return NotFound(new { message = "Transaction not found" });
                }

                // Check for budget warnings if it's an expense
                BudgetWarningDto? budgetWarning = null;
                if (dto.TransactionType.ToLower() == "expense" && dto.CategoryId.HasValue)
                {
                    budgetWarning = await _transactionService.CheckBudgetAfterTransactionAsync(
                        userId, dto.CategoryId.Value, dto.Amount, dto.TransactionDate);
                }

                var response = new
                {
                    transaction,
                    budgetWarning
                };

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating transaction", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTransaction(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var success = await _transactionService.DeleteTransactionAsync(id, userId);
                if (!success)
                {
                    return NotFound(new { message = "Transaction not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting transaction", error = ex.Message });
            }
        }

        [HttpGet("budget-alerts")]
        public async Task<ActionResult<List<BudgetAlertDto>>> GetBudgetAlerts()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var alerts = await _transactionService.GetBudgetAlertsAsync(userId);
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving budget alerts", error = ex.Message });
            }
        }

        [HttpPost("check-budget-impact")]
        public async Task<ActionResult<BudgetWarningDto>> CheckBudgetImpact([FromBody] CheckBudgetImpactDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var warning = await _transactionService.CheckBudgetAfterTransactionAsync(
                    userId, dto.CategoryId, dto.Amount, dto.TransactionDate);

                if (warning == null)
                {
                    return Ok(new { message = "No budget impact detected" });
                }

                return Ok(warning);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking budget impact", error = ex.Message });
            }
        }
    }

    public class CheckBudgetImpactDto
    {
        public int CategoryId { get; set; }
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; }
    }
}