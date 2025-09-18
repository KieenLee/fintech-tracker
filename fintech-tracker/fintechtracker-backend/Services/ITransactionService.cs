using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Services
{
    public interface ITransactionService
    {
        Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter);
        Task<TransactionDto?> GetTransactionByIdAsync(int transactionId, int userId);
        Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto);
        Task<TransactionDto?> UpdateTransactionAsync(int transactionId, int userId, UpdateTransactionDto dto);
        Task<bool> DeleteTransactionAsync(int transactionId, int userId);

        // Budget-related methods
        Task<BudgetWarningDto?> CheckBudgetAfterTransactionAsync(int userId, int categoryId, decimal amount, DateTime transactionDate);
        Task<List<BudgetAlertDto>> GetBudgetAlertsAsync(int userId);
    }
}