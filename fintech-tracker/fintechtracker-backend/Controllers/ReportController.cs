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
    [Authorize(Roles = "admin")]
    public class ReportController : ControllerBase
    {
        private readonly FinTechDbContext _context;
        private readonly ILogger<ReportController> _logger;

        public ReportController(FinTechDbContext context, ILogger<ReportController> logger)
        {
            _context = context;
            _logger = logger;
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
                "daily" => 0,
                "weekly" => 0,
                "monthly" => 6,
                "yearly" => 24,
                _ => 6
            };
        }

        private int GetDaysFromTimeRange(string timeRange)
        {
            return timeRange.ToLower() switch
            {
                "daily" => 7,
                "weekly" => 56, // 8 weeks
                "monthly" => 180, // ~6 months
                "yearly" => 730, // ~2 years
                _ => 180
            };
        }

        // GET: api/Report/dashboard
        [HttpGet("dashboard")]
        public async Task<ActionResult<ReportDashboardDto>> GetReportDashboard([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var timeRange = filter.TimeRange ?? "monthly";
                var months = GetMonthsFromTimeRange(timeRange);
                var days = GetDaysFromTimeRange(timeRange);
                var startDate = DateTime.Now.AddDays(-days);

                // Calculate metrics
                var metrics = await CalculateMetrics(timeRange, startDate);

                // Get revenue trend data
                var revenueData = await GetRevenueData(timeRange, startDate);

                // Get user growth data
                var userGrowthData = await GetUserGrowthData(timeRange, startDate);

                // Get subscription distribution
                var subscriptionData = await GetSubscriptionDistribution();

                // Get detailed metrics
                var detailedMetrics = await GetDetailedMetrics(timeRange, startDate);

                var response = new ReportDashboardDto
                {
                    Metrics = metrics,
                    RevenueData = revenueData,
                    UserGrowthData = userGrowthData,
                    SubscriptionData = subscriptionData,
                    DetailedMetrics = detailedMetrics
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report dashboard");
                return StatusCode(500, "Internal server error");
            }
        }

        private async Task<ReportMetricsDto> CalculateMetrics(string timeRange, DateTime startDate)
        {
            var currentPeriodStart = startDate;
            var previousPeriodStart = timeRange.ToLower() switch
            {
                "daily" => startDate.AddDays(-7),
                "weekly" => startDate.AddDays(-56),
                "monthly" => startDate.AddMonths(-6),
                "yearly" => startDate.AddYears(-1),
                _ => startDate.AddMonths(-6)
            };

            // Current period metrics
            var totalRevenue = await _context.Transactions
                .Where(t => t.TransactionType == "expense" && t.TransactionDate >= currentPeriodStart)
                .SumAsync(t => (decimal?)t.Amount) ?? 0;

            var totalUsers = await _context.Users
                .CountAsync(u => u.IsActive == true);

            var premiumUsers = await _context.Users
                .Where(u => u.IsActive == true)
                .CountAsync(u => _context.Transactions
                    .Any(t => t.UserId == u.UserId && t.TransactionType == "expense"));

            // Previous period metrics for comparison
            var previousRevenue = await _context.Transactions
                .Where(t => t.TransactionType == "expense" &&
                           t.TransactionDate >= previousPeriodStart &&
                           t.TransactionDate < currentPeriodStart)
                .SumAsync(t => (decimal?)t.Amount) ?? 0;

            var previousUsers = await _context.Users
                .Where(u => u.CreatedAt.HasValue && u.CreatedAt.Value < currentPeriodStart)
                .CountAsync(u => u.IsActive == true);

            // Calculate growth percentages
            var revenueGrowth = previousRevenue > 0
                ? $"+{((double)(totalRevenue - previousRevenue) * 100.0 / (double)previousRevenue):F1}%"
                : "+0%";

            var usersGrowth = previousUsers > 0
                ? $"+{((totalUsers - previousUsers) * 100.0 / previousUsers):F1}%"
                : "+0%";

            return new ReportMetricsDto
            {
                TotalRevenue = totalRevenue,
                TotalUsers = totalUsers,
                PremiumUsers = premiumUsers,
                AvgSessionTime = "12m 35s", // Placeholder - would need session tracking
                RevenueGrowth = revenueGrowth,
                UsersGrowth = usersGrowth,
                PremiumGrowth = "+15.3%", // Placeholder
                SessionGrowth = "+2.1%" // Placeholder
            };
        }

        private async Task<List<RevenueDataDto>> GetRevenueData(string timeRange, DateTime startDate)
        {
            var transactions = await _context.Transactions
                .Where(t => t.TransactionType == "expense" && t.TransactionDate >= startDate)
                .ToListAsync();

            var result = new List<RevenueDataDto>();

            if (timeRange.ToLower() == "monthly")
            {
                // Group by month for last 6 months
                for (int i = 5; i >= 0; i--)
                {
                    var monthStart = DateTime.Now.AddMonths(-i).Date;
                    var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                    var monthTransactions = transactions
                        .Where(t => t.TransactionDate >= monthStart && t.TransactionDate <= monthEnd)
                        .ToList();

                    var revenue = monthTransactions.Sum(t => t.Amount);
                    var users = monthTransactions.Select(t => t.UserId).Distinct().Count();
                    var premium = await _context.Users
                        .Where(u => monthTransactions.Select(mt => mt.UserId).Contains(u.UserId))
                        .CountAsync(u => _context.Transactions
                            .Any(t => t.UserId == u.UserId && t.TransactionType == "expense"));

                    result.Add(new RevenueDataDto
                    {
                        Month = monthStart.ToString("MMM"),
                        Revenue = revenue,
                        Users = users,
                        Premium = premium
                    });
                }
            }
            else
            {
                // Similar logic for other time ranges
                // For now, return sample data for other ranges
                var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun" };
                foreach (var month in months)
                {
                    result.Add(new RevenueDataDto
                    {
                        Month = month,
                        Revenue = new Random().Next(4000, 5000),
                        Users = new Random().Next(100, 150),
                        Premium = new Random().Next(40, 60)
                    });
                }
            }

            return result;
        }

        private async Task<List<UserGrowthDataDto>> GetUserGrowthData(string timeRange, DateTime startDate)
        {
            var result = new List<UserGrowthDataDto>();

            if (timeRange.ToLower() == "daily")
            {
                // Last 7 days
                for (int i = 6; i >= 0; i--)
                {
                    var day = DateTime.Now.AddDays(-i).Date;
                    var dayEnd = day.AddDays(1);

                    var newUsers = await _context.Users
                        .CountAsync(u => u.CreatedAt.HasValue &&
                                    u.CreatedAt.Value.Date == day);

                    var activeUsers = await _context.Transactions
                        .Where(t => t.TransactionDate >= day && t.TransactionDate < dayEnd)
                        .Select(t => t.UserId)
                        .Distinct()
                        .CountAsync();

                    result.Add(new UserGrowthDataDto
                    {
                        Day = day.ToString("MMM dd"),
                        NewUsers = newUsers,
                        ActiveUsers = activeUsers
                    });
                }
            }
            else
            {
                // Sample data for other ranges
                var days = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
                foreach (var day in days)
                {
                    result.Add(new UserGrowthDataDto
                    {
                        Day = day,
                        NewUsers = new Random().Next(5, 15),
                        ActiveUsers = new Random().Next(20, 40)
                    });
                }
            }

            return result;
        }

        private async Task<List<SubscriptionDistributionDto>> GetSubscriptionDistribution()
        {
            var totalUsers = await _context.Users.CountAsync(u => u.IsActive == true);

            var premiumUsers = await _context.Users
                .Where(u => u.IsActive == true)
                .CountAsync(u => _context.Transactions
                    .Any(t => t.UserId == u.UserId && t.TransactionType == "expense"));

            var basicUsers = totalUsers - premiumUsers;

            return new List<SubscriptionDistributionDto>
            {
                new() { Name = "Basic", Value = basicUsers },
                new() { Name = "Premium", Value = premiumUsers }
            };
        }

        private async Task<List<DetailedMetricDto>> GetDetailedMetrics(string timeRange, DateTime startDate)
        {
            var result = new List<DetailedMetricDto>();

            // Last 6 months detailed data
            for (int i = 5; i >= 0; i--)
            {
                var monthStart = DateTime.Now.AddMonths(-i).Date;
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                var revenue = await _context.Transactions
                    .Where(t => t.TransactionType == "expense" &&
                               t.TransactionDate >= monthStart &&
                               t.TransactionDate <= monthEnd)
                    .SumAsync(t => (decimal?)t.Amount) ?? 0;

                var newUsers = await _context.Users
                    .CountAsync(u => u.CreatedAt.HasValue &&
                                u.CreatedAt.Value.Month == monthStart.Month &&
                                u.CreatedAt.Value.Year == monthStart.Year);

                var premiumUsers = await _context.Users
                    .Where(u => u.CreatedAt.HasValue &&
                               u.CreatedAt.Value.Month == monthStart.Month &&
                               u.CreatedAt.Value.Year == monthStart.Year)
                    .CountAsync(u => _context.Transactions
                        .Any(t => t.UserId == u.UserId && t.TransactionType == "expense"));

                var totalMonthUsers = await _context.Users
                    .CountAsync(u => u.CreatedAt.HasValue &&
                                u.CreatedAt.Value <= monthEnd);

                var conversionRate = totalMonthUsers > 0
                    ? $"{(premiumUsers * 100.0 / totalMonthUsers):F1}%"
                    : "0%";

                result.Add(new DetailedMetricDto
                {
                    Month = monthStart.ToString("MMM"),
                    Revenue = revenue,
                    NewUsers = newUsers,
                    PremiumUsers = premiumUsers,
                    ConversionRate = conversionRate,
                    ChurnRate = "2.3%" // Placeholder - would need complex calculation
                });
            }

            return result;
        }
    }
}