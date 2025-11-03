using Telegram.Bot;
using Telegram.Bot.Types;
using fintechtracker_backend.Services;
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
            ITelegramBotClient botClient,
            ILogger<TelegramService> logger)
        {
            _context = context;
            _aiService = aiService;
            _transactionService = transactionService;
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
                        return existing.Response ?? "✅ Giao dịch đã được ghi nhận trước đó.";
                    }
                }

                // Check if user exists
                var telegramUser = await GetTelegramUserAsync(telegramUserId);
                if (telegramUser == null)
                {
                    return "❌ Bạn chưa liên kết tài khoản. Vui lòng sử dụng /link <token>";
                }

                _logger.LogInformation("Processing NEW message for user {UserId}: {Message}", telegramUser.UserId, messageText);

                // Log message with Telegram message ID
                var message = new TelegramMessage
                {
                    TelegramUserId = telegramUserId,
                    MessageText = messageText,
                    TelegramMessageId = telegramMessageId,
                    Processed = false
                };
                _context.TelegramMessages.Add(message);

                // Extract transaction data using AI
                _logger.LogInformation("Calling AI service to extract transaction data...");
                var transactionData = await _aiService.ExtractTransactionDataAsync(messageText);

                _logger.LogInformation("AI extracted: Type={Type}, Amount={Amount}, Category={Category}, Description={Description}",
                    transactionData.Type, transactionData.Amount, transactionData.Category, transactionData.Description);

                // Get default account for user
                var defaultAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.UserId == telegramUser.UserId && a.IsActive == true);

                if (defaultAccount == null)
                {
                    _logger.LogWarning("No default account found for user {UserId}", telegramUser.UserId);
                    return "❌ Không tìm thấy tài khoản. Vui lòng tạo tài khoản trước.";
                }

                _logger.LogInformation("Using account: {AccountName} (ID: {AccountId})",
                    defaultAccount.AccountName, defaultAccount.AccountId);

                // Find category
                int? categoryId = null;
                if (!string.IsNullOrEmpty(transactionData.Category))
                {
                    var transactionType = transactionData.Type.ToString().ToLower();

                    // First try user-specific category
                    var category = await _context.Categories
                        .Where(c => c.CategoryName == transactionData.Category
                            && c.TransactionType == transactionType
                            && c.UserId == telegramUser.UserId
                            && c.IsActive == true)
                        .FirstOrDefaultAsync();

                    // If not found, try default category
                    if (category == null)
                    {
                        category = await _context.Categories
                            .Where(c => c.CategoryName == transactionData.Category
                                && c.TransactionType == transactionType
                                && c.IsDefault == true
                                && c.IsActive == true)
                            .FirstOrDefaultAsync();
                    }

                    if (category != null)
                    {
                        categoryId = category.CategoryId;
                        _logger.LogInformation("Found category: {CategoryName} (ID: {CategoryId})",
                            category.CategoryName, categoryId);
                    }
                    else
                    {
                        _logger.LogWarning("Category '{CategoryName}' not found for type '{Type}'",
                            transactionData.Category, transactionType);
                    }
                }

                // Validate amount
                if (transactionData.Amount <= 0)
                {
                    _logger.LogError("Invalid amount from AI: {Amount}", transactionData.Amount);
                    return "❌ Không thể xác định số tiền. Vui lòng thử lại với định dạng: 'Mua cà phê 25000'";
                }

                // Create transaction DTO
                var transactionDto = new CreateTransactionDto
                {
                    AccountId = defaultAccount.AccountId,
                    CategoryId = categoryId,
                    Amount = transactionData.Amount,
                    TransactionType = transactionData.Type.ToString().ToLower(),
                    Description = transactionData.Description,
                    TransactionDate = DateTime.Now
                };

                _logger.LogInformation("Creating transaction: AccountId={AccountId}, CategoryId={CategoryId}, Amount={Amount}, Type={Type}",
                    transactionDto.AccountId, transactionDto.CategoryId, transactionDto.Amount, transactionDto.TransactionType);

                // Create transaction
                var createdTransaction = await _transactionService.CreateTransactionAsync(
                    telegramUser.UserId,
                    transactionDto
                );

                _logger.LogInformation("Transaction created successfully with ID: {TransactionId}",
                    createdTransaction.TransactionId);

                // Format response message
                var categoryDisplay = !string.IsNullOrEmpty(transactionData.Category)
                    ? transactionData.Category
                    : "Chưa phân loại";

                var typeEmoji = transactionData.Type == TransactionType.Income ? "💰" : "💸";
                var typeText = transactionData.Type == TransactionType.Income ? "thu nhập" : "chi tiêu";

                message.Processed = true;
                message.Response = $"{typeEmoji} Ghi nhận {typeText}: '{transactionData.Description}' - {transactionData.Amount:N0}đ\n" +
                                  $"📁 Danh mục: {categoryDisplay}\n" +
                                  $"💼 Tài khoản: {defaultAccount.AccountName}";

                await _context.SaveChangesAsync();

                _logger.LogInformation("Message {MessageId} processed successfully for user {UserId}",
                    telegramMessageId, telegramUser.UserId);

                return message.Response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message {MessageId} from {TelegramUserId}: {Message}",
                    telegramMessageId, telegramUserId, ex.Message);
                return $"❌ Lỗi xử lý: {ex.Message}\nVui lòng thử lại.";
            }
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