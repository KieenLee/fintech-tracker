using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;

namespace fintechtracker_backend.Repositories
{
    public interface ITransactionRepository
    {
        Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter);
        Task<TransactionDto?> GetTransactionByIdAsync(long transactionId, int userId);
        Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto);
        Task<TransactionDto?> UpdateTransactionAsync(long transactionId, int userId, UpdateTransactionDto dto);
        Task<bool> DeleteTransactionAsync(long transactionId, int userId);
        Task<Account?> GetAccountByIdAsync(int accountId, int userId);
        Task<Category?> GetCategoryByIdAsync(int categoryId);
        Task<TransactionStatisticsDto> GetStatisticsByPeriodAsync(int userId, DateTime startDate, DateTime endDate);
        Task<List<CategoriesSpendingDto>> GetSpendingByCategoryAsync(int userId, DateTime startDate, DateTime endDate);
        Task<List<DailyTransactionSummaryDto>> GetDailyTransactionsAsync(int userId, DateTime startDate, DateTime endDate);
    }
}