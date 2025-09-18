using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Repositories
{
    public interface IBudgetRepository
    {
        Task<BudgetResponseDto> GetUserBudgetsAsync(int userId, BudgetFilterDto filter);
        Task<BudgetDto?> GetBudgetByIdAsync(int budgetId, int userId);
        Task<BudgetDto> CreateBudgetAsync(int userId, CreateBudgetDto dto);
        Task<BudgetDto?> UpdateBudgetAsync(int budgetId, int userId, UpdateBudgetDto dto);
        Task<bool> DeleteBudgetAsync(int budgetId, int userId);
        Task<List<BudgetDto>> GetActiveBudgetsAsync(int userId);
    }
}