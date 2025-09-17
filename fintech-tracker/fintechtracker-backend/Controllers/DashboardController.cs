using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly FinTechDbContext _context;

        public DashboardController(FinTechDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                // Lấy tất cả accounts của user
                var accounts = await _context.Accounts
                    .Where(a => a.UserId == userId)
                    .Select(a => new AccountSummaryDto
                    {
                        AccountId = a.AccountId,
                        AccountName = a.AccountName,
                        AccountType = a.AccountType,
                        CurrentBalance = a.CurrentBalance
                    })
                    .ToListAsync();

                // Lấy transactions trong 30 ngày gần nhất
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                var transactions = await _context.Transactions
                    .Include(t => t.Category)
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId && t.TransactionDate >= thirtyDaysAgo)
                    .ToListAsync();

                // Tính toán summary
                var totalIncome = transactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var totalExpense = transactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                // Top expense categories
                var topCategories = transactions
                    .Where(t => t.TransactionType.ToLower() == "expense" && t.Category != null)
                    .GroupBy(t => new { CategoryId = t.Category!.CategoryId, CategoryName = t.Category!.CategoryName })
                    .Select(g => new CategoryExpenseDto
                    {
                        CategoryId = g.Key.CategoryId,
                        CategoryName = g.Key.CategoryName,
                        TotalAmount = g.Sum(t => t.Amount),
                        Percentage = totalExpense > 0 ? Math.Round((g.Sum(t => t.Amount) / totalExpense) * 100, 2) : 0
                    })
                    .OrderByDescending(c => c.TotalAmount)
                    .Take(5)
                    .ToList();

                // Recent transactions
                var recentTransactions = transactions
                    .OrderByDescending(t => t.TransactionDate)
                    .Take(10)
                    .Select(t => new RecentTransactionDto
                    {
                        TransactionId = t.TransactionId,
                        Description = t.Description ?? "",
                        Amount = t.Amount,
                        TransactionType = t.TransactionType,
                        CategoryName = t.Category?.CategoryName ?? "Uncategorized",
                        AccountName = t.Account.AccountName,
                        TransactionDate = t.TransactionDate
                    })
                    .ToList();

                var dashboardSummary = new DashboardSummaryDto
                {
                    TotalIncome = totalIncome,
                    TotalExpense = totalExpense,
                    NetBalance = totalIncome - totalExpense,
                    TransactionCount = transactions.Count,
                    Accounts = accounts,
                    TopExpenseCategories = topCategories,
                    RecentTransactions = recentTransactions
                };

                return Ok(dashboardSummary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("monthly-trend")]
        public async Task<ActionResult<List<MonthlyTrendDto>>> GetMonthlyTrend()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
                
                var transactions = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId && t.TransactionDate >= sixMonthsAgo)
                    .ToListAsync();

                var monthlyTrend = transactions
                    .GroupBy(t => new { Year = t.TransactionDate.Year, Month = t.TransactionDate.Month })
                    .Select(g => new MonthlyTrendDto
                    {
                        Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        Income = g.Where(t => t.TransactionType.ToLower() == "income").Sum(t => t.Amount),
                        Expense = g.Where(t => t.TransactionType.ToLower() == "expense").Sum(t => t.Amount)
                    })
                    .OrderBy(m => m.Month)
                    .ToList();

                return Ok(monthlyTrend);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var totalAccounts = await _context.Accounts
                    .CountAsync(a => a.UserId == userId);

                var totalCategories = await _context.Categories
                    .CountAsync(c => c.UserId == userId);

                var thisMonthTransactions = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId && 
                               t.TransactionDate.Month == DateTime.UtcNow.Month &&
                               t.TransactionDate.Year == DateTime.UtcNow.Year)
                    .CountAsync();

                return Ok(new
                {
                    totalAccounts,
                    totalCategories,
                    thisMonthTransactions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }
    }
}