using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Repositories
{
    public interface ITransactionRepository
    {
        Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter);
        Task<TransactionDto?> GetTransactionByIdAsync(long transactionId, int userId);
        Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto);
        Task<TransactionDto?> UpdateTransactionAsync(long transactionId, int userId, UpdateTransactionDto dto);
        Task<bool> DeleteTransactionAsync(long transactionId, int userId);
    }
}