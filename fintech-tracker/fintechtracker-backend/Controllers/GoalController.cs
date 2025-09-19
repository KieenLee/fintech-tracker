using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using fintechtracker_backend.Data;
using fintechtracker_backend.Models;
using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GoalController : ControllerBase
    {
        private readonly FinTechDbContext _context;

        public GoalController(FinTechDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // GET: api/Goal
        [HttpGet]
        public async Task<ActionResult<List<GoalDto>>> GetGoals()
        {
            var userId = GetCurrentUserId();

            var goals = await _context.Goals
                .Where(g => g.UserId == userId && g.IsActive == true)
                .OrderByDescending(g => g.CreatedAt)
                .Select(g => new GoalDto
                {
                    GoalId = g.GoalId,
                    GoalName = g.GoalName,
                    TargetAmount = g.TargetAmount,
                    CurrentAmount = g.CurrentAmount,
                    TargetDate = g.TargetDate,
                    Description = g.Description,
                    Priority = g.GoalColor ?? "Medium", // Sử dụng GoalColor để lưu Priority
                    IsActive = g.IsActive ?? true,
                    CreatedAt = g.CreatedAt
                })
                .ToListAsync();

            return Ok(goals);
        }

        // GET: api/Goal/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GoalDto>> GetGoal(int id)
        {
            var userId = GetCurrentUserId();

            var goal = await _context.Goals
                .Where(g => g.GoalId == id && g.UserId == userId)
                .Select(g => new GoalDto
                {
                    GoalId = g.GoalId,
                    GoalName = g.GoalName,
                    TargetAmount = g.TargetAmount,
                    CurrentAmount = g.CurrentAmount,
                    TargetDate = g.TargetDate,
                    Description = g.Description,
                    Priority = g.GoalColor ?? "Medium",
                    IsActive = g.IsActive ?? true,
                    CreatedAt = g.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (goal == null)
            {
                return NotFound();
            }

            return Ok(goal);
        }

        // POST: api/Goal
        [HttpPost]
        public async Task<ActionResult<GoalDto>> CreateGoal([FromBody] CreateGoalDto createGoalDto)
        {
            var userId = GetCurrentUserId();

            var goal = new Goal
            {
                UserId = userId,
                GoalName = createGoalDto.GoalName,
                TargetAmount = createGoalDto.TargetAmount,
                CurrentAmount = createGoalDto.CurrentAmount,
                TargetDate = createGoalDto.TargetDate,
                Description = createGoalDto.Description,
                GoalColor = createGoalDto.Priority, // Sử dụng GoalColor để lưu Priority
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Goals.Add(goal);
            await _context.SaveChangesAsync();

            var goalDto = new GoalDto
            {
                GoalId = goal.GoalId,
                GoalName = goal.GoalName,
                TargetAmount = goal.TargetAmount,
                CurrentAmount = goal.CurrentAmount,
                TargetDate = goal.TargetDate,
                Description = goal.Description,
                Priority = goal.GoalColor ?? "Medium",
                IsActive = goal.IsActive ?? true,
                CreatedAt = goal.CreatedAt
            };

            return CreatedAtAction(nameof(GetGoal), new { id = goal.GoalId }, goalDto);
        }

        // PUT: api/Goal/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGoal(int id, [FromBody] UpdateGoalDto updateGoalDto)
        {
            var userId = GetCurrentUserId();

            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.GoalId == id && g.UserId == userId);

            if (goal == null)
            {
                return NotFound();
            }

            goal.GoalName = updateGoalDto.GoalName;
            goal.TargetAmount = updateGoalDto.TargetAmount;
            goal.CurrentAmount = updateGoalDto.CurrentAmount;
            goal.TargetDate = updateGoalDto.TargetDate;
            goal.Description = updateGoalDto.Description;
            goal.GoalColor = updateGoalDto.Priority;
            goal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Goal/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            var userId = GetCurrentUserId();

            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.GoalId == id && g.UserId == userId);

            if (goal == null)
            {
                return NotFound();
            }

            // Soft delete
            goal.IsActive = false;
            goal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Goal/5/add-money
        [HttpPost("{id}/add-money")]
        public async Task<ActionResult<GoalDto>> AddMoneyToGoal(int id, [FromBody] AddMoneyToGoalDto addMoneyDto)
        {
            var userId = GetCurrentUserId();

            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.GoalId == id && g.UserId == userId && g.IsActive == true);

            if (goal == null)
            {
                return NotFound();
            }

            // Không cho phép vượt quá target amount
            goal.CurrentAmount = Math.Min(goal.CurrentAmount + addMoneyDto.Amount, goal.TargetAmount);
            goal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var goalDto = new GoalDto
            {
                GoalId = goal.GoalId,
                GoalName = goal.GoalName,
                TargetAmount = goal.TargetAmount,
                CurrentAmount = goal.CurrentAmount,
                TargetDate = goal.TargetDate,
                Description = goal.Description,
                Priority = goal.GoalColor ?? "Medium",
                IsActive = goal.IsActive ?? true,
                CreatedAt = goal.CreatedAt
            };

            return Ok(goalDto);
        }
    }
}