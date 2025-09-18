using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace fintechtracker_backend.Repositories
{
    public class BudgetRepository : IBudgetRepository
    {
        private readonly FinTechDbContext _context;

        public BudgetRepository(FinTechDbContext context)
        {
            _context = context;
        }

        public async Task<BudgetResponseDto> GetUserBudgetsAsync(int userId, BudgetFilterDto filter)
        {
            var query = _context.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId);

            // Apply filters
            if (filter.CategoryId.HasValue)
                query = query.Where(b => b.CategoryId == filter.CategoryId.Value);

            if (filter.StartDate.HasValue)
            {
                var startDateOnly = DateOnly.FromDateTime(filter.StartDate.Value);
                query = query.Where(b => b.EndDate >= startDateOnly);
            }

            if (filter.EndDate.HasValue)
            {
                var endDateOnly = DateOnly.FromDateTime(filter.EndDate.Value);
                query = query.Where(b => b.StartDate <= endDateOnly);
            }

            // Add filter for active budgets if specified
            if (filter.IsActive.HasValue && filter.IsActive.Value)
            {
                var currentDate = DateOnly.FromDateTime(DateTime.Today);
                query = query.Where(b => b.StartDate <= currentDate && b.EndDate >= currentDate);
            }

            var budgets = await query.OrderBy(b => b.StartDate).ToListAsync();
            var budgetDtos = new List<BudgetDto>();

            foreach (var budget in budgets)
            {
                var spentAmount = await CalculateSpentAmountAsync(userId, budget.CategoryId, budget.StartDate, budget.EndDate);

                budgetDtos.Add(new BudgetDto
                {
                    BudgetId = budget.BudgetId,
                    UserId = budget.UserId,
                    CategoryId = budget.CategoryId,
                    CategoryName = budget.Category.CategoryName,
                    Amount = budget.Amount,
                    SpentAmount = spentAmount,
                    StartDate = budget.StartDate.ToDateTime(TimeOnly.MinValue),
                    EndDate = budget.EndDate.ToDateTime(TimeOnly.MaxValue),
                    IsRecurring = budget.IsRecurring ?? false,
                    NotificationThreshold = budget.NotificationThreshold ?? 90.00m,
                    CreatedAt = budget.CreatedAt ?? DateTime.UtcNow,
                    UpdatedAt = budget.UpdatedAt ?? DateTime.UtcNow
                });
            }

            var totalBudgetAmount = budgetDtos.Sum(b => b.Amount);
            var totalSpentAmount = budgetDtos.Sum(b => b.SpentAmount);

            return new BudgetResponseDto
            {
                Budgets = budgetDtos,
                TotalCount = budgetDtos.Count,
                TotalBudgetAmount = totalBudgetAmount,
                TotalSpentAmount = totalSpentAmount,
                OverallProgressPercentage = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0
            };
        }

        public async Task<BudgetDto?> GetBudgetByIdAsync(int budgetId, int userId)
        {
            var budget = await _context.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.BudgetId == budgetId && b.UserId == userId);

            if (budget == null) return null;

            var spentAmount = await CalculateSpentAmountAsync(userId, budget.CategoryId, budget.StartDate, budget.EndDate);

            return new BudgetDto
            {
                BudgetId = budget.BudgetId,
                UserId = budget.UserId,
                CategoryId = budget.CategoryId,
                CategoryName = budget.Category.CategoryName,
                Amount = budget.Amount,
                SpentAmount = spentAmount,
                StartDate = budget.StartDate.ToDateTime(TimeOnly.MinValue),
                EndDate = budget.EndDate.ToDateTime(TimeOnly.MaxValue),
                IsRecurring = budget.IsRecurring ?? false,
                NotificationThreshold = budget.NotificationThreshold ?? 90.00m,
                CreatedAt = budget.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = budget.UpdatedAt ?? DateTime.UtcNow
            };
        }

        public async Task<BudgetDto> CreateBudgetAsync(int userId, CreateBudgetDto dto)
        {
            // Validate input dates
            if (dto.StartDate >= dto.EndDate)
                throw new ArgumentException("Start date must be before end date");

            // Check if category belongs to user
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == dto.CategoryId &&
                    (c.UserId == userId || c.UserId == null));

            if (category == null)
                throw new ArgumentException("Category not found or doesn't belong to user");

            // Convert DateTime to DateOnly for comparison
            var startDateOnly = DateOnly.FromDateTime(dto.StartDate);
            var endDateOnly = DateOnly.FromDateTime(dto.EndDate);

            // Check for overlapping budgets - Fixed logic
            var existingBudget = await _context.Budgets
                .AnyAsync(b => b.UserId == userId &&
                              b.CategoryId == dto.CategoryId &&
                              (
                                  // New budget starts during existing budget
                                  (startDateOnly >= b.StartDate && startDateOnly <= b.EndDate) ||
                                  // New budget ends during existing budget
                                  (endDateOnly >= b.StartDate && endDateOnly <= b.EndDate) ||
                                  // New budget completely covers existing budget
                                  (startDateOnly <= b.StartDate && endDateOnly >= b.EndDate)
                              ));

            if (existingBudget)
                throw new ArgumentException("Budget already exists for this category in the specified period");

            var budget = new Budget
            {
                UserId = userId,
                CategoryId = dto.CategoryId,
                Amount = dto.Amount,
                StartDate = startDateOnly,
                EndDate = endDateOnly,
                IsRecurring = dto.IsRecurring,
                NotificationThreshold = dto.NotificationThreshold,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Budgets.Add(budget);
            await _context.SaveChangesAsync();

            return await GetBudgetByIdAsync(budget.BudgetId, userId) ??
                throw new InvalidOperationException("Budget was not found after creation");
        }

        public async Task<BudgetDto?> UpdateBudgetAsync(int budgetId, int userId, UpdateBudgetDto dto)
        {
            var budget = await _context.Budgets
                .FirstOrDefaultAsync(b => b.BudgetId == budgetId && b.UserId == userId);

            if (budget == null) return null;

            // Validate input dates
            if (dto.StartDate >= dto.EndDate)
                throw new ArgumentException("Start date must be before end date");

            // Check if category belongs to user (if changing category)
            if (budget.CategoryId != dto.CategoryId)
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryId == dto.CategoryId &&
                        (c.UserId == userId || c.UserId == null));

                if (category == null)
                    throw new ArgumentException("Category not found or doesn't belong to user");
            }

            // Convert DateTime to DateOnly for comparison
            var startDateOnly = DateOnly.FromDateTime(dto.StartDate);
            var endDateOnly = DateOnly.FromDateTime(dto.EndDate);

            // Check for overlapping budgets (exclude current budget)
            var existingBudget = await _context.Budgets
                .AnyAsync(b => b.UserId == userId &&
                              b.CategoryId == dto.CategoryId &&
                              b.BudgetId != budgetId && // Exclude current budget
                              (
                                  (startDateOnly >= b.StartDate && startDateOnly <= b.EndDate) ||
                                  (endDateOnly >= b.StartDate && endDateOnly <= b.EndDate) ||
                                  (startDateOnly <= b.StartDate && endDateOnly >= b.EndDate)
                              ));

            if (existingBudget)
                throw new ArgumentException("Budget already exists for this category in the specified period");

            // Update budget
            budget.CategoryId = dto.CategoryId;
            budget.Amount = dto.Amount;
            budget.StartDate = startDateOnly;
            budget.EndDate = endDateOnly;
            budget.IsRecurring = dto.IsRecurring;
            budget.NotificationThreshold = dto.NotificationThreshold;
            budget.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetBudgetByIdAsync(budgetId, userId);
        }

        public async Task<bool> DeleteBudgetAsync(int budgetId, int userId)
        {
            var budget = await _context.Budgets
                .FirstOrDefaultAsync(b => b.BudgetId == budgetId && b.UserId == userId);

            if (budget == null) return false;

            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<BudgetDto>> GetActiveBudgetsAsync(int userId)
        {
            var currentDate = DateTime.Today;
            var filter = new BudgetFilterDto
            {
                StartDate = currentDate,
                EndDate = currentDate,
                IsActive = true
            };

            var result = await GetUserBudgetsAsync(userId, filter);
            return result.Budgets;
        }

        private async Task<decimal> CalculateSpentAmountAsync(int userId, int categoryId, DateOnly startDate, DateOnly endDate)
        {
            var start = startDate.ToDateTime(TimeOnly.MinValue);
            var end = endDate.ToDateTime(TimeOnly.MaxValue);

            return await _context.Transactions
                .Where(t => t.UserId == userId &&
                           t.CategoryId == categoryId &&
                           t.TransactionType.ToLower() == "expense" &&
                           t.TransactionDate >= start &&
                           t.TransactionDate <= end)
                .SumAsync(t => t.Amount);
        }
    }
}