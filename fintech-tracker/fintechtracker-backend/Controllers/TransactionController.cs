using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionRepository _transactionRepository;

        public TransactionController(ITransactionRepository transactionRepository)
        {
            _transactionRepository = transactionRepository;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetTransactions([FromQuery] TransactionFilterDto filter)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var transactionResponse = await _transactionRepository.GetUserTransactionsAsync(userId, filter);

                return Ok(new
                {
                    transactions = transactionResponse.Transactions,
                    totalCount = transactionResponse.TotalCount,
                    page = transactionResponse.Page,
                    pageSize = transactionResponse.PageSize,
                    totalPages = (int)Math.Ceiling((double)transactionResponse.TotalCount / transactionResponse.PageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving transactions", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TransactionDto>> GetTransaction(long id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var transaction = await _transactionRepository.GetTransactionByIdAsync(id, userId);
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
        public async Task<ActionResult<TransactionDto>> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var transaction = await _transactionRepository.CreateTransactionAsync(userId, dto);
                return CreatedAtAction(nameof(GetTransaction), new { id = transaction.TransactionId }, transaction);
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
        public async Task<ActionResult<TransactionDto>> UpdateTransaction(long id, [FromBody] UpdateTransactionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                dto.TransactionId = id;
                var transaction = await _transactionRepository.UpdateTransactionAsync(id, userId, dto);
                if (transaction == null)
                {
                    return NotFound(new { message = "Transaction not found" });
                }

                return Ok(transaction);
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
        public async Task<ActionResult> DeleteTransaction(long id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _transactionRepository.DeleteTransactionAsync(id, userId);
                if (!result)
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
    }
}