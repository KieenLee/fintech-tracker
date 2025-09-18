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

        // NEW: Add search functionality
        Task<TransactionResponseDto> SearchTransactionsAsync(int userId, string searchTerm, TransactionFilterDto filter);

        // Budget-related methods
        Task<BudgetWarningDto?> CheckBudgetAfterTransactionAsync(int userId, int categoryId, decimal amount, DateTime transactionDate);
        Task<List<BudgetAlertDto>> GetBudgetAlertsAsync(int userId);

        // NEW: Add helper methods for filtering
        Task<List<TransactionDto>> GetTransactionsByCategoryAsync(int userId, int categoryId);
        Task<List<TransactionDto>> GetTransactionsByAccountAsync(int userId, int accountId);
        Task<List<TransactionDto>> GetTransactionsByDateRangeAsync(int userId, DateTime fromDate, DateTime toDate);
        Task<List<TransactionDto>> GetTransactionsByAmountRangeAsync(int userId, decimal minAmount, decimal maxAmount);
    }
}