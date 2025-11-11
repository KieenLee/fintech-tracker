using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;

namespace fintechtracker_backend.Services
{
    public class QuickAddService : IQuickAddService
    {
        private readonly IAIService _aiService;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ITransactionService _transactionService;
        private readonly ILogger<QuickAddService> _logger;

        public QuickAddService(
            IAIService aiService,
            ITransactionRepository transactionRepository,
            IAccountRepository accountRepository,
            ICategoryRepository categoryRepository,
            ITransactionService transactionService,
            ILogger<QuickAddService> logger)
        {
            _aiService = aiService;
            _transactionRepository = transactionRepository;
            _accountRepository = accountRepository;
            _categoryRepository = categoryRepository;
            _transactionService = transactionService;
            _logger = logger;
        }

        public async Task<QuickAddResponseDto> ProcessMessageAsync(int userId, QuickAddRequestDto request)
        {
            try
            {
                // Build context
                var context = await BuildContextAsync(userId, request.Message, request.Language);

                // Call AI
                var aiResponse = await _aiService.ProcessQuickAddMessageAsync(context);

                // Auto-create transaction if type is "transaction"
                if (aiResponse.Type == "transaction" && aiResponse.Transaction != null)
                {
                    try
                    {
                        var createDto = new CreateTransactionDto
                        {
                            AccountId = aiResponse.Transaction.AccountId,
                            CategoryId = aiResponse.Transaction.CategoryId,
                            Amount = aiResponse.Transaction.Amount,
                            TransactionType = aiResponse.Transaction.TransactionType,
                            Description = aiResponse.Transaction.Description,
                            TransactionDate = aiResponse.Transaction.TransactionDate
                        };

                        await _transactionService.CreateTransactionAsync(userId, createDto);
                        _logger.LogInformation("Transaction created successfully via QuickAdd for user {UserId}", userId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to create transaction via QuickAdd");
                        aiResponse.Response = request.Language == "vi"
                            ? "Đã phân tích giao dịch nhưng không thể lưu. Vui lòng thử lại."
                            : "Transaction parsed but failed to save. Please try again.";
                    }
                }

                return aiResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing QuickAdd message for user {UserId}", userId);
                return new QuickAddResponseDto
                {
                    Type = "query",
                    Response = request.Language == "vi"
                        ? "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại."
                        : "Sorry, an error occurred. Please try again."
                };
            }
        }

        private async Task<AIPromptContext> BuildContextAsync(int userId, string message, string language)
        {
            var accounts = await _accountRepository.GetUserAccountsAsync(userId);
            var categories = await _categoryRepository.GetUserCategoriesAsync(userId);
            var filter = new TransactionFilterDto
            {
                Page = 1,
                PageSize = 20
            };
            var recentTransactionsResponse = await _transactionRepository.GetUserTransactionsAsync(userId, filter);

            return new AIPromptContext
            {
                UserId = userId,
                UserMessage = message,
                Language = language,
                UserAccounts = accounts.ToList(),
                UserCategories = categories.ToList(),
                RecentTransactions = recentTransactionsResponse.Transactions.ToList()
            };
        }
    }
}