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
    public class BudgetController : ControllerBase
    {
        private readonly IBudgetRepository _budgetRepository;

        public BudgetController(IBudgetRepository budgetRepository)
        {
            _budgetRepository = budgetRepository;
        }

        [HttpGet]
        public async Task<ActionResult<BudgetResponseDto>> GetBudgets([FromQuery] BudgetFilterDto filter)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var result = await _budgetRepository.GetUserBudgetsAsync(userId, filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving budgets", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BudgetDto>> GetBudget(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var budget = await _budgetRepository.GetBudgetByIdAsync(id, userId);
                if (budget == null)
                {
                    return NotFound(new { message = "Budget not found" });
                }
                return Ok(budget);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving budget", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<BudgetDto>> CreateBudget([FromBody] CreateBudgetDto dto)
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
                var budget = await _budgetRepository.CreateBudgetAsync(userId, dto);
                return CreatedAtAction(nameof(GetBudget), new { id = budget.BudgetId }, budget);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating budget", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<BudgetDto>> UpdateBudget(int id, [FromBody] UpdateBudgetDto dto)
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
                dto.BudgetId = id;
                var budget = await _budgetRepository.UpdateBudgetAsync(id, userId, dto);
                if (budget == null)
                {
                    return NotFound(new { message = "Budget not found" });
                }
                return Ok(budget);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating budget", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteBudget(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var success = await _budgetRepository.DeleteBudgetAsync(id, userId);
                if (!success)
                {
                    return NotFound(new { message = "Budget not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting budget", error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<ActionResult<List<BudgetDto>>> GetActiveBudgets()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            try
            {
                var budgets = await _budgetRepository.GetActiveBudgetsAsync(userId);
                return Ok(budgets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving active budgets", error = ex.Message });
            }
        }
    }
}