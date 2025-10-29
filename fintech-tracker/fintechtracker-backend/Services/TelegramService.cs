using Telegram.Bot;
using Telegram.Bot.Types;
using fintechtracker_backend.Services.Interfaces;
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

        public async Task<string> ProcessMessageAsync(long telegramUserId, string messageText)
        {
            try
            {
                // Check if user exists
                var telegramUser = await GetTelegramUserAsync(telegramUserId);
                if (telegramUser == null)
                {
                    return "❌ Bạn chưa liên kết tài khoản. Vui lòng sử dụng /link <token>";
                }

                // Log message
                var message = new TelegramMessage
                {
                    TelegramUserId = telegramUserId,
                    MessageText = messageText,
                    Processed = false
                };
                _context.TelegramMessages.Add(message);

                // Extract transaction data using AI
                var transactionData = await _aiService.ExtractTransactionDataAsync(messageText);

                // Get default account for user
                var defaultAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.UserId == telegramUser.UserId);

                if (defaultAccount == null)
                {
                    return "❌ Không tìm thấy tài khoản mặc định. Vui lòng tạo tài khoản trước.";
                }

                // Get or create category
                int? categoryId = null;
                if (!string.IsNullOrEmpty(transactionData.Category))
                {
                    var category = await _context.Categories
                        .FirstOrDefaultAsync(c => c.CategoryName == transactionData.Category
                            && c.UserId == telegramUser.UserId);
                    categoryId = category?.CategoryId;
                }

                // Create transaction
                var transactionDto = new CreateTransactionDto
                {
                    AccountId = defaultAccount.AccountId,
                    CategoryId = categoryId,
                    Amount = transactionData.Amount,
                    TransactionType = transactionData.Type.ToString().ToLower(), // "income" or "expense"
                    Description = transactionData.Description,
                    TransactionDate = DateTime.Now
                };

                // FIX: Pass userId as first parameter
                await _transactionService.CreateTransactionAsync(telegramUser.UserId, transactionDto);

                // Update message status
                message.Processed = true;
                message.Response = $"✅ Ghi nhận {transactionData.Type.ToString().ToLower()} '{transactionData.Description} - {transactionData.Amount:N0}đ' (Danh mục: {transactionData.Category})";
                await _context.SaveChangesAsync();

                return message.Response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from {TelegramUserId}", telegramUserId);
                return "❌ Không thể xử lý. Vui lòng thử lại.";
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