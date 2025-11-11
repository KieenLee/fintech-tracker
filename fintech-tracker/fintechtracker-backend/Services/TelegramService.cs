using Telegram.Bot;
using Telegram.Bot.Types;
using fintechtracker_backend.Services;
using fintechtracker_backend.Repositories;
using fintechtracker_backend.Data;
using fintechtracker_backend.Models;
using fintechtracker_backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace fintechtracker_backend.Services
{
    public class TelegramService : ITelegramService
    {
        private readonly FinTechDbContext _context;
        private readonly IAIService _aiService;
        private readonly ITransactionService _transactionService;
        private readonly IAccountRepository _accountRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ITransactionRepository _transactionRepository;
        private readonly ITelegramBotClient _botClient;
        private readonly ILogger<TelegramService> _logger;

        // Category mapping Vietnamese to English (matching your DB)
        private readonly Dictionary<string, string> _categoryMapping = new()
        {
            // Expense categories
            { "Ăn uống", "Food & Dining" },
            { "Di chuyển", "Transportation" },
            { "Mua sắm", "Shopping" },
            { "Giải trí", "Entertainment" },
            { "Hóa đơn", "Bills & Utilities" },
            { "Sức khỏe", "Healthcare" },
            { "Giáo dục", "Education" },
            { "Du lịch", "Travel" },
            { "Khác", "Other" },
            
            // Income categories
            { "Lương", "Salary" },
            { "Freelance", "Freelancing" },
            { "Kinh doanh", "Business" },
            { "Đầu tư", "Investment" }
        };

        public TelegramService(
            FinTechDbContext context,
            IAIService aiService,
            ITransactionService transactionService,
            IAccountRepository accountRepository,
            ICategoryRepository categoryRepository,
            ITransactionRepository transactionRepository,
            ITelegramBotClient botClient,
            ILogger<TelegramService> logger)
        {
            _context = context;
            _aiService = aiService;
            _transactionService = transactionService;
            _accountRepository = accountRepository;
            _categoryRepository = categoryRepository;
            _transactionRepository = transactionRepository;
            _botClient = botClient;
            _logger = logger;
        }

        public async Task<bool> RegisterUserAsync(long telegramUserId, int userId,
            long chatId, string firstName, string lastName, string username)
        {
            try
            {
                var existingUser = await _context.TelegramUsers
                    .FirstOrDefaultAsync(t => t.TelegramUserId == telegramUserId);

                if (existingUser != null)
                {
                    return false;
                }

                var telegramUser = new TelegramUser
                {
                    TelegramUserId = telegramUserId,
                    UserId = userId,
                    ChatId = chatId,
                    FirstName = firstName,
                    LastName = lastName,
                    Username = username,
                    IsActive = true
                };

                _context.TelegramUsers.Add(telegramUser);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering telegram user {TelegramUserId}", telegramUserId);
                return false;
            }
        }

        public async Task<string> ProcessMessageAsync(long telegramUserId, string messageText, int? telegramMessageId = null)
        {
            try
            {
                // DEDUPLICATION: Check if message already processed
                if (telegramMessageId.HasValue)
                {
                    var existing = await _context.TelegramMessages
                        .Where(m => m.TelegramUserId == telegramUserId && m.TelegramMessageId == telegramMessageId)
                        .FirstOrDefaultAsync();

                    if (existing != null)
                    {
                        _logger.LogWarning("Duplicate message {MessageId} from user {UserId} - returning cached response",
                            telegramMessageId, telegramUserId);
                        return existing.Response ?? "✅ Tin nhắn đã được xử lý trước đó.";
                    }
                }

                // Check if user exists
                var telegramUser = await GetTelegramUserAsync(telegramUserId);
                if (telegramUser == null)
                {
                    return "❌ Bạn chưa liên kết tài khoản. Vui lòng sử dụng /link <token>";
                }

                _logger.LogInformation("Processing NEW message for user {UserId}: {Message}",
                    telegramUser.UserId, messageText);

                // Log message with Telegram message ID
                var message = new TelegramMessage
                {
                    TelegramUserId = telegramUserId,
                    MessageText = messageText,
                    TelegramMessageId = telegramMessageId,
                    Processed = false
                };
                _context.TelegramMessages.Add(message);

                // ===== NEW: Build AI Context (like QuickAdd) =====
                var context = await BuildTelegramAIContextAsync(telegramUser.UserId, messageText);

                // ===== NEW: Process with AI (QuickAdd logic) =====
                var aiResponse = await _aiService.ProcessQuickAddMessageAsync(context);

                string responseText;

                if (aiResponse.Type == "transaction" && aiResponse.Transaction != null)
                {
                    // Create transaction automatically
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

                        var createdTransaction = await _transactionService.CreateTransactionAsync(
                            telegramUser.UserId,
                            createDto
                        );

                        _logger.LogInformation("Transaction created via Telegram: ID={TransactionId}",
                            createdTransaction.TransactionId);

                        // Get account and category names for better response
                        var account = await _context.Accounts
                            .FirstOrDefaultAsync(a => a.AccountId == createDto.AccountId);
                        var category = createDto.CategoryId.HasValue
                            ? await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == createDto.CategoryId)
                            : null;

                        var typeEmoji = createDto.TransactionType == "income" ? "💰" : "💸";
                        var typeText = createDto.TransactionType == "income" ? "thu nhập" : "chi tiêu";
                        var categoryDisplay = category?.CategoryName ?? "Chưa phân loại";

                        responseText = $"{typeEmoji} Đã ghi nhận {typeText}\n" +
                                      $"💵 Số tiền: {createDto.Amount:N0}đ\n" +
                                      $"📝 Mô tả: {createDto.Description}\n" +
                                      $"📁 Danh mục: {categoryDisplay}\n" +
                                      $"💼 Tài khoản: {account?.AccountName ?? "Unknown"}\n" +
                                      $"📅 Ngày: {createDto.TransactionDate:dd/MM/yyyy}";
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to create transaction via Telegram");
                        responseText = "❌ Lỗi khi lưu giao dịch. Vui lòng thử lại.";
                    }
                }
                else if (aiResponse.Type == "query")
                {
                    // Return query result from AI
                    responseText = aiResponse.Response;
                }
                else
                {
                    responseText = aiResponse.Response;
                }

                // Save processed message
                message.Processed = true;
                message.Response = responseText;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Message {MessageId} processed successfully for user {UserId}",
                    telegramMessageId, telegramUser.UserId);

                return responseText;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message {MessageId} from {TelegramUserId}: {Message}",
                    telegramMessageId, telegramUserId, ex.Message);
                return $"❌ Lỗi xử lý: {ex.Message}\nVui lòng thử lại.";
            }
        }

        private async Task<AIPromptContext> BuildTelegramAIContextAsync(int userId, string message)
        {
            // Get user's accounts
            var accounts = await _accountRepository.GetUserAccountsAsync(userId);

            // Get user's categories
            var categories = await _categoryRepository.GetUserCategoriesAsync(userId);

            // ===== SỬA ĐÂY: Get detailed statistics instead of just recent transactions =====

            // Calculate date ranges
            var now = DateTime.Now;
            var todayStart = now.Date;
            var weekStart = now.AddDays(-(int)now.DayOfWeek + 1).Date; // Monday
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var yearStart = new DateTime(now.Year, 1, 1);

            // Get statistics for different periods
            var todayStats = await _transactionRepository.GetStatisticsByPeriodAsync(userId, todayStart, now);
            var weekStats = await _transactionRepository.GetStatisticsByPeriodAsync(userId, weekStart, now);
            var monthStats = await _transactionRepository.GetStatisticsByPeriodAsync(userId, monthStart, now);

            // Get last 20 transactions for context
            var filter = new TransactionFilterDto { Page = 1, PageSize = 20 };
            var recentTransactionsResponse = await _transactionRepository.GetUserTransactionsAsync(userId, filter);

            return new AIPromptContext
            {
                UserId = userId,
                UserMessage = message,
                Language = "vi",
                UserAccounts = accounts.ToList(),
                UserCategories = categories.ToList(),
                RecentTransactions = recentTransactionsResponse.Transactions.ToList(),
                TodayStatistics = todayStats,
                WeekStatistics = weekStats,
                MonthStatistics = monthStats
            };
        }

        public async Task<bool> SendMessageAsync(long chatId, string message)
        {
            try
            {
                await _botClient.SendTextMessageAsync(chatId, message);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message to chat {ChatId}", chatId);
                return false;
            }
        }

        public async Task<bool> CheckUserExistsAsync(long telegramUserId)
        {
            return await _context.TelegramUsers
                .AnyAsync(t => t.TelegramUserId == telegramUserId && t.IsActive);
        }

        public async Task<TelegramUser?> GetTelegramUserAsync(long telegramUserId)
        {
            return await _context.TelegramUsers
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TelegramUserId == telegramUserId && t.IsActive);
        }
    }
}