using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace fintechtracker_backend.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly FinTechDbContext _context;

        public TransactionRepository(FinTechDbContext context)
        {
            _context = context;
        }

        public async Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter)
        {
            var query = _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId);

            // Apply filters
            if (filter.CategoryId.HasValue)
                query = query.Where(t => t.CategoryId == filter.CategoryId.Value);

            if (filter.AccountId.HasValue)
                query = query.Where(t => t.AccountId == filter.AccountId.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(t => t.TransactionDate >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(t => t.TransactionDate <= filter.ToDate.Value);

            if (!string.IsNullOrEmpty(filter.TransactionType))
                query = query.Where(t => t.TransactionType == filter.TransactionType);

            if (filter.MinAmount.HasValue)
                query = query.Where(t => t.Amount >= filter.MinAmount.Value);

            if (filter.MaxAmount.HasValue)
                query = query.Where(t => t.Amount <= filter.MaxAmount.Value);

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "amount" => filter.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Amount)
                    : query.OrderByDescending(t => t.Amount),
                "description" => filter.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Description)
                    : query.OrderByDescending(t => t.Description),
                _ => filter.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.TransactionDate)
                    : query.OrderByDescending(t => t.TransactionDate)
            };

            // Apply pagination
            var transactions = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(t => new TransactionDto
                {
                    TransactionId = t.TransactionId,
                    UserId = t.UserId,
                    AccountId = t.AccountId,
                    AccountName = t.Account.AccountName,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category != null ? t.Category.CategoryName : null,
                    Amount = t.Amount,
                    TransactionType = t.TransactionType,
                    Description = t.Description,
                    TransactionDate = t.TransactionDate,
                    Location = t.Location,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return new TransactionResponseDto
            {
                Transactions = transactions,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<TransactionDto?> GetTransactionByIdAsync(long transactionId, int userId)
        {
            return await _context.Transactions
                .Where(t => t.TransactionId == transactionId && t.UserId == userId)
                .Select(t => new TransactionDto
                {
                    TransactionId = t.TransactionId,
                    UserId = t.UserId,
                    AccountId = t.AccountId,
                    AccountName = t.Account.AccountName,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category != null ? t.Category.CategoryName : null,
                    Amount = t.Amount,
                    TransactionType = t.TransactionType,
                    Description = t.Description,
                    TransactionDate = t.TransactionDate,
                    Location = t.Location,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto)
        {
            var transaction = new Transaction
            {
                UserId = userId,
                AccountId = dto.AccountId,
                CategoryId = dto.CategoryId,
                Amount = dto.Amount,
                TransactionType = dto.TransactionType,
                Description = dto.Description,
                TransactionDate = dto.TransactionDate,
                Location = dto.Location,
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Return the created transaction with related data
            return await GetTransactionByIdAsync(transaction.TransactionId, userId)
                ?? throw new InvalidOperationException("Failed to retrieve created transaction");
        }

        public async Task<TransactionDto?> UpdateTransactionAsync(long transactionId, int userId, UpdateTransactionDto dto)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId && t.UserId == userId);

            if (transaction == null)
                return null;

            transaction.AccountId = dto.AccountId;
            transaction.CategoryId = dto.CategoryId;
            transaction.Amount = dto.Amount;
            transaction.TransactionType = dto.TransactionType;
            transaction.Description = dto.Description;
            transaction.TransactionDate = dto.TransactionDate;
            transaction.Location = dto.Location;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetTransactionByIdAsync(transactionId, userId);
        }

        public async Task<bool> DeleteTransactionAsync(long transactionId, int userId)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId && t.UserId == userId);

            if (transaction == null)
                return false;

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<Account?> GetAccountByIdAsync(int accountId, int userId)
        {
            return await _context.Accounts
                .Where(a => a.AccountId == accountId && a.UserId == userId && a.IsActive == true)
                .FirstOrDefaultAsync();
        }

        public async Task<Category?> GetCategoryByIdAsync(int categoryId)
        {
            return await _context.Categories
                .Where(c => c.CategoryId == categoryId && c.IsActive == true)
                .FirstOrDefaultAsync();
        }

        public async Task<TransactionStatisticsDto> GetStatisticsByPeriodAsync(int userId, DateTime startDate, DateTime endDate)
        {
            // Normalize dates: Start of day for startDate, end of current moment for endDate
            var start = startDate.Date; // 00:00:00
            var end = endDate <= DateTime.Now ? endDate : DateTime.Now; // Don't include future

            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId
                    && t.TransactionDate >= start
                    && t.TransactionDate <= end)
                .ToListAsync();

            var totalIncome = transactions
                .Where(t => t.TransactionType == "income")
                .Sum(t => t.Amount);

            var totalExpense = transactions
                .Where(t => t.TransactionType == "expense")
                .Sum(t => t.Amount);

            // Category breakdown
            var categoryBreakdown = transactions
                .Where(t => t.TransactionType == "expense") // Focus on expenses
                .GroupBy(t => new { t.CategoryId, CategoryName = t.Category != null ? t.Category.CategoryName : null, t.TransactionType })
                .Select(g => new CategoriesSpendingDto
                {
                    CategoryId = g.Key.CategoryId ?? 0,
                    CategoryName = g.Key.CategoryName ?? "Uncategorized",
                    TransactionType = g.Key.TransactionType,
                    TotalAmount = g.Sum(t => t.Amount),
                    TransactionCount = g.Count(),
                    Percentage = totalExpense > 0 ? (g.Sum(t => t.Amount) / totalExpense * 100) : 0
                })
                .OrderByDescending(c => c.TotalAmount)
                .ToList();

            // Daily breakdown
            var dailyBreakdown = transactions
                .GroupBy(t => t.TransactionDate.Date)
                .Select(g => new DailyTransactionSummaryDto
                {
                    Date = g.Key,
                    TransactionCount = g.Count(),
                    TotalIncome = g.Where(t => t.TransactionType == "income").Sum(t => t.Amount),
                    TotalExpense = g.Where(t => t.TransactionType == "expense").Sum(t => t.Amount),
                    NetBalance = g.Where(t => t.TransactionType == "income").Sum(t => t.Amount) -
                                g.Where(t => t.TransactionType == "expense").Sum(t => t.Amount)
                })
                .OrderBy(d => d.Date)
                .ToList();

            return new TransactionStatisticsDto
            {
                UserId = userId,
                StartDate = start,
                EndDate = end,
                TotalTransactions = transactions.Count,
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                NetBalance = totalIncome - totalExpense,
                IncomeCount = transactions.Count(t => t.TransactionType == "income"),
                ExpenseCount = transactions.Count(t => t.TransactionType == "expense"),
                CategoryBreakdown = categoryBreakdown,
                DailyBreakdown = dailyBreakdown
            };
        }

        public async Task<List<CategoriesSpendingDto>> GetSpendingByCategoryAsync(int userId, DateTime startDate, DateTime endDate)
        {
            var start = startDate.Date;
            var end = endDate <= DateTime.Now ? endDate : DateTime.Now;

            var result = await _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId
                    && t.TransactionDate >= start
                    && t.TransactionDate <= end
                    && t.TransactionType == "expense")
                .GroupBy(t => new { t.CategoryId, CategoryName = t.Category != null ? t.Category.CategoryName : null, t.TransactionType })
                .Select(g => new CategoriesSpendingDto
                {
                    CategoryId = g.Key.CategoryId ?? 0,
                    CategoryName = g.Key.CategoryName ?? "Uncategorized",
                    TransactionType = g.Key.TransactionType,
                    TotalAmount = g.Sum(t => t.Amount),
                    TransactionCount = g.Count()
                })
                .OrderByDescending(c => c.TotalAmount)
                .ToListAsync();

            var totalExpense = result.Sum(c => c.TotalAmount);
            result.ForEach(c => c.Percentage = totalExpense > 0 ? (c.TotalAmount / totalExpense * 100) : 0);

            return result;
        }

        public async Task<List<DailyTransactionSummaryDto>> GetDailyTransactionsAsync(int userId, DateTime startDate, DateTime endDate)
        {
            var start = startDate.Date;
            var end = endDate <= DateTime.Now ? endDate : DateTime.Now;

            return await _context.Transactions
                .Where(t => t.UserId == userId
                    && t.TransactionDate >= start
                    && t.TransactionDate <= end)
                .GroupBy(t => t.TransactionDate.Date)
                .Select(g => new DailyTransactionSummaryDto
                {
                    Date = g.Key,
                    TransactionCount = g.Count(),
                    TotalIncome = g.Where(t => t.TransactionType == "income").Sum(t => t.Amount),
                    TotalExpense = g.Where(t => t.TransactionType == "expense").Sum(t => t.Amount),
                    NetBalance = g.Where(t => t.TransactionType == "income").Sum(t => t.Amount) -
                                g.Where(t => t.TransactionType == "expense").Sum(t => t.Amount)
                })
                .OrderBy(d => d.Date)
                .ToListAsync();
        }
    }
}