using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;

namespace fintechtracker_backend.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IBudgetRepository _budgetRepository;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IBudgetRepository budgetRepository)
        {
            _transactionRepository = transactionRepository;
            _budgetRepository = budgetRepository;
        }

        public async Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter)
        {
            try
            {
                // Log incoming filter for debugging
                Console.WriteLine($"TransactionService - Received filter: CategoryId={filter.CategoryId}, AccountId={filter.AccountId}, Type={filter.TransactionType}");
                Console.WriteLine($"TransactionService - Date range: {filter.FromDate} to {filter.ToDate}");
                Console.WriteLine($"TransactionService - Amount range: {filter.MinAmount} to {filter.MaxAmount}");

                var result = await _transactionRepository.GetUserTransactionsAsync(userId, filter);

                Console.WriteLine($"TransactionService - Returned {result.Transactions.Count()} transactions");

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in TransactionService.GetUserTransactionsAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<TransactionDto?> GetTransactionByIdAsync(int transactionId, int userId)
        {
            return await _transactionRepository.GetTransactionByIdAsync(transactionId, userId);
        }

        public async Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto)
        {
            // Validate account belongs to user
            var account = await _transactionRepository.GetAccountByIdAsync(dto.AccountId, userId);
            if (account == null)
            {
                throw new UnauthorizedAccessException("Account not found or does not belong to user");
            }

            // Validate category if provided
            if (dto.CategoryId.HasValue)
            {
                var category = await _transactionRepository.GetCategoryByIdAsync(dto.CategoryId.Value);
                if (category == null)
                {
                    throw new ArgumentException("Category not found");
                }
            }

            // Create transaction
            var createdTransaction = await _transactionRepository.CreateTransactionAsync(userId, dto);

            if (createdTransaction == null)
            {
                throw new InvalidOperationException("Failed to create transaction");
            }

            return createdTransaction;
        }

        public async Task<TransactionDto?> UpdateTransactionAsync(int transactionId, int userId, UpdateTransactionDto dto)
        {
            return await _transactionRepository.UpdateTransactionAsync(transactionId, userId, dto);
        }

        public async Task<bool> DeleteTransactionAsync(int transactionId, int userId)
        {
            return await _transactionRepository.DeleteTransactionAsync(transactionId, userId);
        }

        public async Task<TransactionResponseDto> SearchTransactionsAsync(int userId, string searchTerm, TransactionFilterDto filter)
        {
            try
            {
                // Get all transactions first
                var allTransactions = await _transactionRepository.GetUserTransactionsAsync(userId, filter);

                if (string.IsNullOrEmpty(searchTerm))
                {
                    return allTransactions;
                }

                // Filter by search term (description, location, category name)
                var filteredTransactions = allTransactions.Transactions.Where(t =>
                    (!string.IsNullOrEmpty(t.Description) && t.Description.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(t.Location) && t.Location.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(t.CategoryName) && t.CategoryName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(t.AccountName) && t.AccountName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                ).ToList();

                return new TransactionResponseDto
                {
                    Transactions = filteredTransactions,
                    TotalCount = filteredTransactions.Count,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = (int)Math.Ceiling((double)filteredTransactions.Count / filter.PageSize)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SearchTransactionsAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<TransactionDto>> GetTransactionsByCategoryAsync(int userId, int categoryId)
        {
            var filter = new TransactionFilterDto
            {
                CategoryId = categoryId,
                Page = 1,
                PageSize = int.MaxValue
            };

            var result = await _transactionRepository.GetUserTransactionsAsync(userId, filter);
            return result.Transactions.ToList();
        }

        public async Task<List<TransactionDto>> GetTransactionsByAccountAsync(int userId, int accountId)
        {
            var filter = new TransactionFilterDto
            {
                AccountId = accountId,
                Page = 1,
                PageSize = int.MaxValue
            };

            var result = await _transactionRepository.GetUserTransactionsAsync(userId, filter);
            return result.Transactions.ToList();
        }

        public async Task<List<TransactionDto>> GetTransactionsByDateRangeAsync(int userId, DateTime fromDate, DateTime toDate)
        {
            var filter = new TransactionFilterDto
            {
                FromDate = fromDate,
                ToDate = toDate,
                Page = 1,
                PageSize = int.MaxValue
            };

            var result = await _transactionRepository.GetUserTransactionsAsync(userId, filter);
            return result.Transactions.ToList();
        }

        public async Task<List<TransactionDto>> GetTransactionsByAmountRangeAsync(int userId, decimal minAmount, decimal maxAmount)
        {
            var filter = new TransactionFilterDto
            {
                MinAmount = minAmount,
                MaxAmount = maxAmount,
                Page = 1,
                PageSize = int.MaxValue
            };

            var result = await _transactionRepository.GetUserTransactionsAsync(userId, filter);
            return result.Transactions.ToList();
        }

        // TODO: Implement budget-related methods
        public Task<BudgetWarningDto?> CheckBudgetAfterTransactionAsync(int userId, int categoryId, decimal amount, DateTime transactionDate)
        {
            // TODO: Implement when IBudgetRepository is available
            return Task.FromResult<BudgetWarningDto?>(null);
        }

        public Task<List<BudgetAlertDto>> GetBudgetAlertsAsync(int userId)
        {
            // TODO: Implement when IBudgetRepository is available
            return Task.FromResult(new List<BudgetAlertDto>());
        }
    }
}