using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;

namespace fintechtracker_backend.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IBudgetRepository _budgetRepository;

        public TransactionService(ITransactionRepository transactionRepository, IBudgetRepository budgetRepository)
        {
            _transactionRepository = transactionRepository;
            _budgetRepository = budgetRepository;
        }

        public async Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter)
        {
            return await _transactionRepository.GetUserTransactionsAsync(userId, filter);
        }

        public async Task<TransactionDto?> GetTransactionByIdAsync(int transactionId, int userId)
        {
            return await _transactionRepository.GetTransactionByIdAsync(transactionId, userId);
        }

        public async Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto)
        {
            // Create transaction first
            var transaction = await _transactionRepository.CreateTransactionAsync(userId, dto);

            // Check budget impact if it's an expense
            if (dto.TransactionType.ToLower() == "expense" && dto.CategoryId.HasValue)
            {
                // We don't await this as it's just for notification purposes
                _ = CheckBudgetAfterTransactionAsync(userId, dto.CategoryId.Value, dto.Amount, dto.TransactionDate);
            }

            return transaction;
        }

        public async Task<TransactionDto?> UpdateTransactionAsync(int transactionId, int userId, UpdateTransactionDto dto)
        {
            // Get original transaction for budget recalculation
            var originalTransaction = await _transactionRepository.GetTransactionByIdAsync(transactionId, userId);
            if (originalTransaction == null) return null;

            // Update transaction
            var updatedTransaction = await _transactionRepository.UpdateTransactionAsync(transactionId, userId, dto);
            if (updatedTransaction == null) return null;

            // Check budget impact if it's an expense
            if (dto.TransactionType.ToLower() == "expense" && dto.CategoryId.HasValue)
            {
                _ = CheckBudgetAfterTransactionAsync(userId, dto.CategoryId.Value, dto.Amount, dto.TransactionDate);
            }

            return updatedTransaction;
        }

        public async Task<bool> DeleteTransactionAsync(int transactionId, int userId)
        {
            return await _transactionRepository.DeleteTransactionAsync(transactionId, userId);
        }

        public async Task<BudgetWarningDto?> CheckBudgetAfterTransactionAsync(int userId, int categoryId, decimal amount, DateTime transactionDate)
        {
            try
            {
                // Find active budget for this category and date
                var budgets = await _budgetRepository.GetUserBudgetsAsync(userId, new BudgetFilterDto
                {
                    CategoryId = categoryId,
                    StartDate = transactionDate,
                    EndDate = transactionDate,
                    IsActive = true
                });

                var activeBudget = budgets.Budgets.FirstOrDefault();
                if (activeBudget == null) return null;

                var newSpent = activeBudget.SpentAmount + amount;
                var progressPercentage = activeBudget.Amount > 0 ? (newSpent / activeBudget.Amount) * 100 : 0;

                string warningLevel = "Normal";
                string message = "";

                if (progressPercentage >= 100)
                {
                    warningLevel = "Exceeded";
                    var overAmount = newSpent - activeBudget.Amount;
                    message = $"Budget exceeded! You've overspent by {overAmount:C} in {activeBudget.CategoryName}";
                }
                else if (progressPercentage >= activeBudget.NotificationThreshold)
                {
                    warningLevel = "Critical";
                    message = $"Critical warning! You've spent {progressPercentage:F1}% of your {activeBudget.CategoryName} budget";
                }
                else if (progressPercentage >= 80)
                {
                    warningLevel = "Warning";
                    message = $"Approaching budget limit: {progressPercentage:F1}% spent on {activeBudget.CategoryName}";
                }

                if (warningLevel != "Normal")
                {
                    return new BudgetWarningDto
                    {
                        BudgetId = activeBudget.BudgetId,
                        CategoryName = activeBudget.CategoryName,
                        BudgetAmount = activeBudget.Amount,
                        CurrentSpent = activeBudget.SpentAmount,
                        NewSpent = newSpent,
                        ProgressPercentage = progressPercentage,
                        WarningLevel = warningLevel,
                        Message = message
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                // Log error but don't fail the transaction
                Console.WriteLine($"Error checking budget: {ex.Message}");
                return null;
            }
        }

        public async Task<List<BudgetAlertDto>> GetBudgetAlertsAsync(int userId)
        {
            try
            {
                var budgets = await _budgetRepository.GetActiveBudgetsAsync(userId);
                var alerts = new List<BudgetAlertDto>();

                foreach (var budget in budgets)
                {
                    if (budget.ProgressPercentage >= budget.NotificationThreshold)
                    {
                        alerts.Add(new BudgetAlertDto
                        {
                            BudgetId = budget.BudgetId,
                            CategoryName = budget.CategoryName,
                            BudgetAmount = budget.Amount,
                            SpentAmount = budget.SpentAmount,
                            ProgressPercentage = budget.ProgressPercentage,
                            AlertType = budget.ProgressPercentage >= 100 ? "Exceeded" : "Threshold",
                            AlertDate = DateTime.UtcNow
                        });
                    }
                }

                return alerts;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting budget alerts: {ex.Message}");
                return new List<BudgetAlertDto>();
            }
        }
    }
}