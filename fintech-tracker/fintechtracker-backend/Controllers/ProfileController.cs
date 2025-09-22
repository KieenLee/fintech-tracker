using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly FinTechDbContext _context;

        public ProfileController(FinTechDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }
            return userId;
        }

        // GET: api/Profile
        [HttpGet]
        public async Task<ActionResult<ProfileResponseDto>> GetProfile()
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users
                .Include(u => u.Userprofile)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            // Tính Quick Stats
            var stats = await CalculateQuickStats(userId);

            // Tính Account Level
            var accountLevel = await CalculateAccountLevel(userId);

            // Lấy Achievements
            var achievements = await GetUserAchievements(userId);

            var response = new ProfileResponseDto
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.Userprofile?.FirstName,
                LastName = user.Userprofile?.LastName,
                Phone = user.Userprofile?.Phone,
                AvatarUrl = user.Userprofile?.AvatarUrl,
                JoinDate = user.CreatedAt?.ToString("MMMM yyyy"),
                Role = user.Role,
                Stats = stats,
                AccountLevel = accountLevel,
                Achievements = achievements
            };

            return Ok(response);
        }

        // PUT: api/Profile
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfilesDto updateDto)
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users
                .Include(u => u.Userprofile)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            // Cập nhật thông tin User
            user.Username = updateDto.Username;
            user.Email = updateDto.Email;
            user.UpdatedAt = DateTime.UtcNow;

            // Cập nhật UserProfile
            if (user.Userprofile == null)
            {
                user.Userprofile = new Userprofile { UserId = userId };
                _context.Userprofiles.Add(user.Userprofile);
            }

            user.Userprofile.FirstName = updateDto.FirstName;
            user.Userprofile.LastName = updateDto.LastName;
            user.Userprofile.Phone = updateDto.Phone;
            user.Userprofile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        private async Task<QuickStatsDto> CalculateQuickStats(int userId)
        {
            var totalTransactions = await _context.Transactions
                .CountAsync(t => t.UserId == userId);

            var budgetsCreated = await _context.Budgets
                .CountAsync(b => b.UserId == userId);

            var goalsAchieved = await _context.Goals
                .CountAsync(g => g.UserId == userId && g.CurrentAmount >= g.TargetAmount);

            var daysActive = await CalculateDaysActive(userId);

            return new QuickStatsDto
            {
                TotalTransactions = totalTransactions,
                BudgetsCreated = budgetsCreated,
                GoalsAchieved = goalsAchieved,
                DaysActive = daysActive
            };
        }

        private async Task<int> CalculateDaysActive(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.CreatedAt == null) return 0;

            return (DateTime.Now - user.CreatedAt.Value).Days;
        }

        private async Task<AccountLevelDto> CalculateAccountLevel(int userId)
        {
            var daysActive = await CalculateDaysActive(userId);
            var totalTransactions = await _context.Transactions.CountAsync(t => t.UserId == userId);
            var goalsAchieved = await _context.Goals.CountAsync(g => g.UserId == userId && g.CurrentAmount >= g.TargetAmount);

            // Tính điểm dựa trên hoạt động
            var points = (daysActive * 2) + (totalTransactions * 5) + (goalsAchieved * 50);

            var (level, progress, nextLevel) = CalculateLevelFromPoints(points);

            return new AccountLevelDto
            {
                CurrentLevel = level,
                Progress = progress,
                NextLevel = nextLevel,
                Points = points
            };
        }

        private (string level, int progress, string nextLevel) CalculateLevelFromPoints(int points)
        {
            if (points < 100) return ("Bronze", (int)((points / 100.0) * 100), "Silver");
            if (points < 500) return ("Silver", (int)(((points - 100) / 400.0) * 100), "Gold");
            if (points < 1500) return ("Gold", (int)(((points - 500) / 1000.0) * 100), "Platinum");
            if (points < 3000) return ("Platinum", (int)(((points - 1500) / 1500.0) * 100), "Diamond");
            return ("Diamond", 100, "Diamond");
        }

        private async Task<List<AchievementDto>> GetUserAchievements(int userId)
        {
            var stats = await CalculateQuickStats(userId);
            var daysActive = await CalculateDaysActive(userId);
            var firstTransaction = await _context.Transactions
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            var achievements = new List<AchievementDto>();

            // Achievement 1: First Budget Created
            var hasBudget = await _context.Budgets.AnyAsync(b => b.UserId == userId);
            achievements.Add(new AchievementDto
            {
                Id = 1,
                Title = "First Budget Created",
                Description = "Created your first budget category",
                Icon = "Target",
                Earned = hasBudget,
                Date = hasBudget ? (await _context.Budgets.Where(b => b.UserId == userId).OrderBy(b => b.CreatedAt).FirstAsync()).CreatedAt : null,
                Progress = hasBudget ? 100 : 0
            });

            // Achievement 2: Savings Streak (3 consecutive months with positive balance)
            var savingsStreak = await CheckSavingsStreak(userId);
            achievements.Add(new AchievementDto
            {
                Id = 2,
                Title = "Savings Streak",
                Description = "Saved money for 3 consecutive months",
                Icon = "TrendingUp",
                Earned = savingsStreak >= 3,
                Date = savingsStreak >= 3 ? DateTime.Now.AddMonths(-3) : null,
                Progress = Math.Min((savingsStreak / 3.0) * 100, 100)
            });

            // Achievement 3: Goal Achiever
            var hasAchievedGoal = stats.GoalsAchieved > 0;
            achievements.Add(new AchievementDto
            {
                Id = 3,
                Title = "Goal Achiever",
                Description = "Completed your first financial goal",
                Icon = "Trophy",
                Earned = hasAchievedGoal,
                Date = hasAchievedGoal ? (await _context.Goals.Where(g => g.UserId == userId && g.CurrentAmount >= g.TargetAmount).OrderBy(g => g.UpdatedAt).FirstAsync()).UpdatedAt : null,
                Progress = hasAchievedGoal ? 100 : 0
            });

            // Achievement 4: Budget Master (6 months under budget)
            var budgetStreak = await CheckBudgetStreak(userId);
            achievements.Add(new AchievementDto
            {
                Id = 4,
                Title = "Budget Master",
                Description = "Stayed under budget for 6 months",
                Icon = "Award",
                Earned = budgetStreak >= 6,
                Date = budgetStreak >= 6 ? DateTime.Now.AddMonths(-6) : null,
                Progress = Math.Min((budgetStreak / 6.0) * 100, 100)
            });

            // Achievement 5: Transaction Pioneer (100+ transactions)
            var transactionGoal = 100;
            achievements.Add(new AchievementDto
            {
                Id = 5,
                Title = "Transaction Pioneer",
                Description = "Recorded 100+ transactions",
                Icon = "Star",
                Earned = stats.TotalTransactions >= transactionGoal,
                Date = stats.TotalTransactions >= transactionGoal ? firstTransaction?.CreatedAt : null,
                Progress = Math.Min((stats.TotalTransactions / (double)transactionGoal) * 100, 100)
            });

            return achievements;
        }

        private async Task<int> CheckSavingsStreak(int userId)
        {
            // Logic đơn giản: kiểm tra số tháng liên tiếp có income > expenses
            var streak = 0;
            for (int i = 0; i < 12; i++)
            {
                var startDate = DateTime.Now.AddMonths(-(i + 1)).Date;
                var endDate = startDate.AddMonths(1).AddDays(-1);

                var income = await _context.Transactions
                    .Where(t => t.UserId == userId && t.TransactionType == "income" &&
                               t.TransactionDate >= startDate && t.TransactionDate <= endDate)
                    .SumAsync(t => t.Amount);

                var expenses = await _context.Transactions
                    .Where(t => t.UserId == userId && t.TransactionType == "expense" &&
                               t.TransactionDate >= startDate && t.TransactionDate <= endDate)
                    .SumAsync(t => t.Amount);

                if (income > expenses)
                    streak++;
                else
                    break;
            }

            return streak;
        }

        private async Task<int> CheckBudgetStreak(int userId)
        {
            // Logic đơn giản: kiểm tra số tháng liên tiếp không vượt budget
            var streak = 0;
            for (int i = 0; i < 12; i++)
            {
                var startDate = DateTime.Now.AddMonths(-(i + 1)).Date;
                var endDate = startDate.AddMonths(1).AddDays(-1);

                var startDateOnly = DateOnly.FromDateTime(startDate);
                var endDateOnly = DateOnly.FromDateTime(endDate);

                var budgets = await _context.Budgets
                    .Where(b => b.UserId == userId && b.StartDate <= endDateOnly && b.EndDate >= startDateOnly)
                    .ToListAsync();

                if (!budgets.Any()) break;

                var allUnderBudget = true;
                foreach (var budget in budgets)
                {
                    var spent = await _context.Transactions
                        .Where(t => t.UserId == userId && t.CategoryId == budget.CategoryId &&
                                   t.TransactionType == "expense" &&
                                   t.TransactionDate >= startDate && t.TransactionDate <= endDate)
                        .SumAsync(t => t.Amount);

                    if (spent > budget.Amount)
                    {
                        allUnderBudget = false;
                        break;
                    }
                }

                if (allUnderBudget)
                    streak++;
                else
                    break;
            }

            return streak;
        }
    }
}