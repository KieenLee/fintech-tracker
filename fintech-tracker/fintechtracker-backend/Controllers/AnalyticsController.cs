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

        private int GetMonthsFromTimeRange(string timeRange)
        {
            return timeRange.ToLower() switch
            {
                "1week" => 0, // Sẽ xử lý riêng cho week
                "1month" => 1,
                "3months" => 3,
                "6months" => 6,
                "1year" => 12,
                "2years" => 24,
                _ => 6
            };
        }

        private int GetDaysFromTimeRange(string timeRange)
        {
            return timeRange.ToLower() switch
            {
                "1week" => 7,
                "1month" => 30,
                "3months" => 90,
                "6months" => 180,
                "1year" => 365,
                "2years" => 730,
                _ => 180
            };
        }

        private (DateTime startDate, string dataType) GetDateRangeAndType(string timeRange)
        {
            var now = DateTime.Now;
            return timeRange.ToLower() switch
            {
                "1week" => (now.AddDays(-6).Date, "daily"), // 7 ngày gần nhất
                "1month" => (now.AddDays(-27).Date, "weekly"), // 4 tuần gần nhất  
                "3months" => (now.AddMonths(-2).Date, "monthly"), // 3 tháng gần nhất
                "6months" => (now.AddMonths(-5).Date, "monthly"), // 6 tháng gần nhất
                "1year" => (now.AddMonths(-11).Date, "monthly"), // 12 tháng gần nhất
                "2years" => (now.AddMonths(-23).Date, "monthly"), // 24 tháng gần nhất
                _ => (now.AddMonths(-5).Date, "monthly")
            };
        }

        private decimal CalculateAverageMonthlyExpenses(decimal totalExpenses, string timeRange)
        {
            return timeRange.ToLower() switch
            {
                "1week" => totalExpenses * 4.33m, // 1 tuần * 4.33 = 1 tháng
                "1month" => totalExpenses, // Đã là 1 tháng
                "3months" => totalExpenses / 3,
                "6months" => totalExpenses / 6,
                "1year" => totalExpenses / 12,
                "2years" => totalExpenses / 24,
                _ => totalExpenses / 6
            };
        }

        [HttpGet("overview")]
        public async Task<ActionResult<AnalyticsOverviewDto>> GetAnalyticsOverview([FromQuery] AnalyticsFilterDto filter)
        {
            try
            {
                var userId = GetCurrentUserId();
                var (startDate, dataType) = GetDateRangeAndType(filter.TimeRange);

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

                var avgMonthlyExpenses = CalculateAverageMonthlyExpenses(totalExpenses, filter.TimeRange);

                // Tạo dữ liệu theo loại phù hợp
                var chartData = dataType switch
                {
                    "daily" => GenerateDailyChartData(transactions, filter.TimeRange),
                    "weekly" => GenerateWeeklyChartData(transactions, filter.TimeRange),
                    "monthly" => GenerateMonthlyChartData(transactions, filter.TimeRange),
                    _ => GenerateMonthlyChartData(transactions, filter.TimeRange)
                };

                // Tạo breakdown theo category
                var categoryBreakdown = GenerateCategoryBreakdown(transactions);

                // Tạo net worth trend
                var netWorthTrend = await GenerateNetWorthTrend(userId, filter.TimeRange, dataType);

                var result = new AnalyticsOverviewDto
                {
                    TotalIncome = totalIncome,
                    TotalExpenses = totalExpenses,
                    AvgMonthlyExpenses = avgMonthlyExpenses,
                    MonthlyData = chartData,
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

        private List<MonthlyDataDto> GenerateDailyData(List<Models.Transaction> transactions, int days)
        {
            var result = new List<MonthlyDataDto>();
            var currentDate = DateTime.Now;

            for (int i = days - 1; i >= 0; i--)
            {
                var dayDate = currentDate.AddDays(-i);
                var dayTransactions = transactions
                    .Where(t => t.TransactionDate.Date == dayDate.Date)
                    .ToList();

                var income = dayTransactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var expenses = dayTransactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                result.Add(new MonthlyDataDto
                {
                    Month = dayDate.ToString("MM/dd", CultureInfo.InvariantCulture),
                    Income = income,
                    Expenses = expenses
                });
            }

            return result;
        }

        private List<MonthlyDataDto> GenerateWeeklyData(List<Models.Transaction> transactions, int weeks)
        {
            var result = new List<MonthlyDataDto>();
            var currentDate = DateTime.Now;

            for (int i = weeks - 1; i >= 0; i--)
            {
                var weekStartDate = currentDate.AddDays(-(i * 7 + 6)).Date;
                var weekEndDate = currentDate.AddDays(-(i * 7)).Date;

                var weekTransactions = transactions
                    .Where(t => t.TransactionDate.Date >= weekStartDate && t.TransactionDate.Date <= weekEndDate)
                    .ToList();

                var income = weekTransactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var expenses = weekTransactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                result.Add(new MonthlyDataDto
                {
                    Month = $"Week {weeks - i}",
                    Income = income,
                    Expenses = expenses
                });
            }

            return result;
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

        private async Task<List<NetWorthDto>> GenerateNetWorthTrendDaily(int userId, int days)
        {
            var result = new List<NetWorthDto>();
            var currentDate = DateTime.Now;

            // Lấy tổng số dư hiện tại của tất cả tài khoản
            var totalBalance = await _context.Accounts
                .Where(a => a.UserId == userId)
                .SumAsync(a => a.CurrentBalance);

            for (int i = days - 1; i >= 0; i--)
            {
                var dayDate = currentDate.AddDays(-i);

                // Tính net worth ước tính cho ngày đó
                var expensesFromDay = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId &&
                               t.TransactionType.ToLower() == "expense" &&
                               t.TransactionDate.Date >= dayDate.Date)
                    .SumAsync(t => t.Amount);

                var estimatedNetWorth = totalBalance + expensesFromDay - (i * 50); // Giả định tăng trưởng nhỏ

                result.Add(new NetWorthDto
                {
                    Month = dayDate.ToString("MM/dd", CultureInfo.InvariantCulture),
                    NetWorth = Math.Max(estimatedNetWorth, 0)
                });
            }

            return result;
        }

        private async Task<List<NetWorthDto>> GenerateNetWorthTrendWeekly(int userId, int weeks)
        {
            var result = new List<NetWorthDto>();
            var currentDate = DateTime.Now;

            // Lấy tổng số dư hiện tại của tất cả tài khoản
            var totalBalance = await _context.Accounts
                .Where(a => a.UserId == userId)
                .SumAsync(a => a.CurrentBalance);

            for (int i = weeks - 1; i >= 0; i--)
            {
                var weekStartDate = currentDate.AddDays(-(i * 7 + 6));

                // Tính net worth ước tính cho tuần đó
                var expensesFromWeek = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId &&
                               t.TransactionType.ToLower() == "expense" &&
                               t.TransactionDate.Date >= weekStartDate.Date)
                    .SumAsync(t => t.Amount);

                var estimatedNetWorth = totalBalance + expensesFromWeek - (i * 200); // Giả định tăng trưởng

                result.Add(new NetWorthDto
                {
                    Month = $"Week {weeks - i}",
                    NetWorth = Math.Max(estimatedNetWorth, 0)
                });
            }

            return result;
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

        // DAILY DATA
        private List<MonthlyDataDto> GenerateDailyChartData(List<Models.Transaction> transactions, string timeRange)
        {
            var result = new List<MonthlyDataDto>();
            var today = DateTime.Now.Date;

            // Last 7 days
            for (int i = 6; i >= 0; i--)
            {
                var targetDate = today.AddDays(-i);
                var dayTransactions = transactions
                    .Where(t => t.TransactionDate.Date == targetDate)
                    .ToList();

                var income = dayTransactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var expenses = dayTransactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                result.Add(new MonthlyDataDto
                {
                    Month = targetDate.ToString("ddd dd/MM", CultureInfo.InvariantCulture), // "Mon 18/09"
                    Income = income,
                    Expenses = expenses
                });
            }

            return result;
        }

        // WEEKLY DATA
        private List<MonthlyDataDto> GenerateWeeklyChartData(List<Models.Transaction> transactions, string timeRange)
        {
            var result = new List<MonthlyDataDto>();
            var today = DateTime.Now.Date;

            // Last 4 Weeks
            for (int i = 3; i >= 0; i--)
            {
                var weekEndDate = today.AddDays(-i * 7);
                var weekStartDate = weekEndDate.AddDays(-6);

                var weekTransactions = transactions
                    .Where(t => t.TransactionDate.Date >= weekStartDate && t.TransactionDate.Date <= weekEndDate)
                    .ToList();

                var income = weekTransactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var expenses = weekTransactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                result.Add(new MonthlyDataDto
                {
                    Month = $"Week {4 - i}", // "Week 1", "Week 2", "Week 3", "Week 4"
                    Income = income,
                    Expenses = expenses
                });
            }

            return result;
        }

        // MONTHLY DATA - 3months, 6months, 1year, 2years
        private List<MonthlyDataDto> GenerateMonthlyChartData(List<Models.Transaction> transactions, string timeRange)
        {
            var result = new List<MonthlyDataDto>();
            var today = DateTime.Now;

            var monthsCount = timeRange.ToLower() switch
            {
                "3months" => 3,
                "6months" => 6,
                "1year" => 12,
                "2years" => 24,
                _ => 6
            };

            for (int i = monthsCount - 1; i >= 0; i--)
            {
                var targetMonth = today.AddMonths(-i);
                var monthTransactions = transactions
                    .Where(t => t.TransactionDate.Year == targetMonth.Year &&
                               t.TransactionDate.Month == targetMonth.Month)
                    .ToList();

                var income = monthTransactions
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var expenses = monthTransactions
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                result.Add(new MonthlyDataDto
                {
                    Month = targetMonth.ToString("MMM yyyy", CultureInfo.InvariantCulture), // "Sep 2024"
                    Income = income,
                    Expenses = expenses
                });
            }

            return result;
        }

        // NET WORTH TREND
        private async Task<List<NetWorthDto>> GenerateNetWorthTrend(int userId, string timeRange, string dataType)
        {
            var result = new List<NetWorthDto>();
            var totalBalance = await _context.Accounts
                .Where(a => a.UserId == userId)
                .SumAsync(a => a.CurrentBalance);

            switch (dataType)
            {
                case "daily":
                    return await GenerateNetWorthDaily(userId, totalBalance);
                case "weekly":
                    return await GenerateNetWorthWeekly(userId, totalBalance);
                case "monthly":
                    return await GenerateNetWorthMonthly(userId, totalBalance, timeRange);
                default:
                    return await GenerateNetWorthMonthly(userId, totalBalance, timeRange);
            }
        }

        private async Task<List<NetWorthDto>> GenerateNetWorthDaily(int userId, decimal totalBalance)
        {
            var result = new List<NetWorthDto>();
            var today = DateTime.Now.Date;

            for (int i = 6; i >= 0; i--)
            {
                var targetDate = today.AddDays(-i);

                var expensesFromDate = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId &&
                               t.TransactionType.ToLower() == "expense" &&
                               t.TransactionDate.Date >= targetDate)
                    .SumAsync(t => t.Amount);

                var estimatedNetWorth = totalBalance + expensesFromDate - (i * 20);

                result.Add(new NetWorthDto
                {
                    Month = targetDate.ToString("ddd dd/MM", CultureInfo.InvariantCulture),
                    NetWorth = Math.Max(estimatedNetWorth, 0)
                });
            }

            return result;
        }

        private async Task<List<NetWorthDto>> GenerateNetWorthWeekly(int userId, decimal totalBalance)
        {
            var result = new List<NetWorthDto>();
            var today = DateTime.Now.Date;

            for (int i = 3; i >= 0; i--)
            {
                var weekEndDate = today.AddDays(-i * 7);

                var expensesFromWeek = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId &&
                               t.TransactionType.ToLower() == "expense" &&
                               t.TransactionDate.Date >= weekEndDate.AddDays(-6))
                    .SumAsync(t => t.Amount);

                var estimatedNetWorth = totalBalance + expensesFromWeek - (i * 100);

                result.Add(new NetWorthDto
                {
                    Month = $"Week {4 - i}",
                    NetWorth = Math.Max(estimatedNetWorth, 0)
                });
            }

            return result;
        }

        private async Task<List<NetWorthDto>> GenerateNetWorthMonthly(int userId, decimal totalBalance, string timeRange)
        {
            var result = new List<NetWorthDto>();
            var today = DateTime.Now;

            var monthsCount = timeRange.ToLower() switch
            {
                "3months" => 3,
                "6months" => 6,
                "1year" => 12,
                "2years" => 24,
                _ => 6
            };

            for (int i = monthsCount - 1; i >= 0; i--)
            {
                var targetMonth = today.AddMonths(-i);

                var expensesFromMonth = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Account.UserId == userId &&
                               t.TransactionType.ToLower() == "expense" &&
                               t.TransactionDate >= targetMonth.AddDays(-targetMonth.Day + 1))
                    .SumAsync(t => t.Amount);

                var estimatedNetWorth = totalBalance + expensesFromMonth - (i * 500);

                result.Add(new NetWorthDto
                {
                    Month = targetMonth.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    NetWorth = Math.Max(estimatedNetWorth, 0)
                });
            }

            return result;
        }
    }
}