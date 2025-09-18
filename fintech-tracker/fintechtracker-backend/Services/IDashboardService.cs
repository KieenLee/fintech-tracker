using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Services
{
    public interface IDashboardService
    {
        // Existing methods
        Task<DashboardOverviewDto> GetDashboardOverviewAsync(int userId);
        Task<List<BudgetProgressDto>> GetBudgetProgressAsync(int userId);
        Task<List<CategorySpendingDto>> GetTopCategoriesAsync(int userId, int months = 1);
        Task<FinancialSummaryDto> GetFinancialSummaryAsync(int userId);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(int userId);
        Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync(int userId, int months = 6);
    }
}