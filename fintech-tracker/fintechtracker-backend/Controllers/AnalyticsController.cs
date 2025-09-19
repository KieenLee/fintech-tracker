using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using System.Globalization;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly FinTechDbContext _context;

        public AnalyticsController(FinTechDbContext context)
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

        [HttpGet("overview")]
        public async Task<ActionResult<AnalyticsOverviewDto>> GetAnalyticsOverview([FromQuery] AnalyticsFilterDto filter)
        {
            try
            {
                var userId = GetCurrentUserId();
                var monthsToInclude = GetMonthsFromTimeRange(filter.TimeRange);
                var startDate = DateTime.Now.AddMonths(-monthsToInclude).Date;

                // Lấy tất cả giao dịch trong khoảng thời gian
                var transactions = await _context.Transactions
                    .Include(t => t.Account)
                    .Include(t => t.Category)
                    .Where(t => t.Account.UserId == userId && t.TransactionDate >= startDate)
                    .ToListAsync();

                // Tính toán metrics tổng quan
                var totalIncome = transactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var totalExpenses = transactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                var avgMonthlyExpenses = monthsToInclude > 0 ? totalExpenses / monthsToInclude : 0;

                // Tạo dữ liệu theo tháng
                var monthlyData = GenerateMonthlyData(transactions, monthsToInclude);

                // Tạo breakdown theo category (chỉ expenses)
                var categoryBreakdown = GenerateCategoryBreakdown(transactions);

                // Tạo net worth trend (tạm thời dùng tổng số dư các tài khoản)
                var netWorthTrend = await GenerateNetWorthTrend(userId, monthsToInclude);

                var result = new AnalyticsOverviewDto
                {
                    TotalIncome = totalIncome,
                    TotalExpenses = totalExpenses,
                    AvgMonthlyExpenses = avgMonthlyExpenses,
                    MonthlyData = monthlyData,
                    CategoryBreakdown = categoryBreakdown,
                    NetWorthTrend = netWorthTrend
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving analytics data", error = ex.Message });
            }
        }

        private int GetMonthsFromTimeRange(string timeRange)
        {
            return timeRange.ToLower() switch
            {
                "3months" => 3,
                "6months" => 6,
                "1year" => 12,
                "2years" => 24,
                _ => 6
            };
        }

        private List<MonthlyDataDto> GenerateMonthlyData(List<Models.Transaction> transactions, int months)
        {
            var result = new List<MonthlyDataDto>();
            var currentDate = DateTime.Now;

            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = currentDate.AddMonths(-i);
                var monthTransactions = transactions
                    .Where(t => t.TransactionDate.Year == monthDate.Year && t.TransactionDate.Month == monthDate.Month)
                    .ToList();

                var income = monthTransactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var expenses = monthTransactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                result.Add(new MonthlyDataDto
                {
                    Month = monthDate.ToString("MMM", CultureInfo.InvariantCulture),
                    Income = income,
                    Expenses = expenses
                });
            }

            return result;
        }

        private List<CategoryBreakdownDto> GenerateCategoryBreakdown(List<Models.Transaction> transactions)
        {
            var expenseTransactions = transactions
                .Where(t => t.TransactionType.ToLower() == "expense" && t.Category != null)
                .ToList();

            if (!expenseTransactions.Any())
                return new List<CategoryBreakdownDto>();

            var totalExpenses = expenseTransactions.Sum(t => t.Amount);

            var categoryGroups = expenseTransactions
                .GroupBy(t => t.Category?.CategoryName ?? "Unknown")
                .Select(g => new CategoryBreakdownDto
                {
                    Name = g.Key,
                    Value = g.Sum(t => t.Amount),
                    Percentage = totalExpenses > 0 ? (g.Sum(t => t.Amount) / totalExpenses) * 100 : 0
                })
                .OrderByDescending(c => c.Value)
                .Take(6) // Chỉ lấy top 6 categories
                .ToList();

            return categoryGroups;
        }

        private async Task<List<NetWorthDto>> GenerateNetWorthTrend(int userId, int months)
        {
            var result = new List<NetWorthDto>();
            var currentDate = DateTime.Now;

            // Lấy tổng số dư hiện tại của tất cả tài khoản
            var totalBalance = await _context.Accounts
                .Where(a => a.UserId == userId)
                .SumAsync(a => a.CurrentBalance);

            // Tạo trend đơn giản (trong thực tế cần lưu lịch sử số dư)
            for (int i = months - 1; i >= 0; i--)
            {
                var monthDate = currentDate.AddMonths(-i);

                // Tạm thời tính net worth bằng cách lấy số dư hiện tại trừ đi chi tiêu từ tháng đó đến nay
                var expensesFromMonth = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId &&
                               t.TransactionType.ToLower() == "expense" &&
                               t.TransactionDate >= monthDate.Date)
                    .SumAsync(t => t.Amount);

                var estimatedNetWorth = totalBalance + expensesFromMonth - (i * 500); // Giả định tăng trưởng

                result.Add(new NetWorthDto
                {
                    Month = monthDate.ToString("MMM", CultureInfo.InvariantCulture),
                    NetWorth = Math.Max(estimatedNetWorth, 0) // Đảm bảo không âm
                });
            }

            return result;
        }
    }
}