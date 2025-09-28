using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace fintechtracker_backend.Services
{
    public class TelegramService : ITelegramService
    {
        private readonly FinTechDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TelegramService> _logger;
        private readonly string _botToken;

        public TelegramService(
            FinTechDbContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<TelegramService> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
            _botToken = _configuration["Telegram:BotToken"] ?? throw new InvalidOperationException("Telegram bot token not configured");
        }

        public async Task<TelegramProcessResult> ProcessMessageAsync(TelegramMessageDto message)
        {
            try
            {
                // Ensure user exists
                var user = await EnsureUserExistsAsync(message.From);
                
                // Parse message
                var parseResult = ParseTransactionMessage(message.Text);
                
                if (!parseResult.IsValid)
                {
                    return new TelegramProcessResult
                    {
                        ShouldRespond = true,
                        ResponseMessage = parseResult.ErrorMessage
                    };
                }

                // Get default account
                var account = await GetOrCreateDefaultAccountAsync(user.UserId);
                
                // Get category
                var category = await GetOrCreateCategoryAsync(parseResult.CategoryName, parseResult.TransactionType);
                
                // Create transaction
                var transaction = new Transaction
                {
                    UserId = user.UserId,
                    AccountId = account.AccountId,
                    CategoryId = category.CategoryId,
                    Amount = parseResult.Amount,
                    TransactionType = parseResult.TransactionType,
                    Description = parseResult.Description,
                    TransactionDate = DateTime.Now,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Transactions.Add(transaction);
                
                // Update account balance
                account.CurrentBalance += parseResult.Amount;
                account.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();

                var responseMessage = parseResult.TransactionType == "expense"
                    ? $"✅ Chi tiêu: {parseResult.Description} - {Math.Abs(parseResult.Amount):N0}đ\n📂 Danh mục: {parseResult.CategoryName}\n💰 Số dư: {account.CurrentBalance:N0}đ"
                    : $"✅ Thu nhập: {parseResult.Description} - {parseResult.Amount:N0}đ\n📂 Danh mục: {parseResult.CategoryName}\n💰 Số dư: {account.CurrentBalance:N0}đ";

                return new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = responseMessage,
                    TransactionId = transaction.TransactionId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing telegram message");
                return new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = "❌ Lỗi hệ thống. Vui lòng thử lại sau."
                };
            }
        }

        private MessageParseResult ParseTransactionMessage(string text)
        {
            var normalizedText = text.ToLower().Trim();

            // Expense patterns
            var expensePatterns = new[]
            {
                @"^(mua|chi|trả|tiêu)\s+(.+?)\s+(\d+)([ktr]?)$",
                @"^(.+?)\s+(\d+)([ktr]?)$"
            };

            // Income patterns
            var incomePatterns = new[]
            {
                @"^(lương|thưởng|nhận|thu)\s*(.+?)?\s*(\d+)([ktr]?)$"
            };

            // Try expense first
            foreach (var pattern in expensePatterns)
            {
                var match = Regex.Match(normalizedText, pattern);
                if (match.Success)
                {
                    var description = ExtractDescription(match, normalizedText);
                    var amount = ParseAmount(match);
                    
                    return new MessageParseResult
                    {
                        IsValid = true,
                        Amount = -Math.Abs(amount),
                        Description = CapitalizeFirst(description),
                        TransactionType = "expense",
                        CategoryName = DetermineCategoryName(description, "expense")
                    };
                }
            }

            // Try income
            foreach (var pattern in incomePatterns)
            {
                var match = Regex.Match(normalizedText, pattern);
                if (match.Success)
                {
                    var description = ExtractDescription(match, normalizedText) ?? "Thu nhập";
                    var amount = ParseAmount(match);
                    
                    return new MessageParseResult
                    {
                        IsValid = true,
                        Amount = Math.Abs(amount),
                        Description = CapitalizeFirst(description),
                        TransactionType = "income",
                        CategoryName = "Salary"
                    };
                }
            }

            return new MessageParseResult
            {
                IsValid = false,
                ErrorMessage = "❌ Không hiểu tin nhắn.\n\n💡 Thử:\n• 'mua cafe 20k'\n• 'lương tháng 15tr'\n• 'xe grab 50k'"
            };
        }

        // Helper methods
        private decimal ParseAmount(Match match)
        {
            for (int i = match.Groups.Count - 2; i >= 1; i--)
            {
                if (Regex.IsMatch(match.Groups[i].Value, @"^\d+$"))
                {
                    var amount = decimal.Parse(match.Groups[i].Value);
                    var unit = match.Groups[i + 1].Value;
                    
                    if (unit == "k") return amount * 1000;
                    if (unit == "tr") return amount * 1000000;
                    return amount;
                }
            }
            return 0;
        }

        private string ExtractDescription(Match match, string originalText)
        {
            for (int i = 1; i < match.Groups.Count - 2; i++)
            {
                var group = match.Groups[i].Value.Trim();
                if (!string.IsNullOrEmpty(group) && 
                    !new[] { "mua", "chi", "trả", "tiêu", "lương", "thưởng", "nhận", "thu" }.Contains(group))
                {
                    return group;
                }
            }
            return "Giao dịch";
        }

        private string DetermineCategoryName(string description, string type)
        {
            if (type == "expense")
            {
                var keywords = new Dictionary<string, string[]>
                {
                    {"Food & Dining", new[] {"cafe", "cà phê", "ăn", "uống", "cơm", "phở", "bún", "bánh"}},
                    {"Transportation", new[] {"xe", "taxi", "grab", "xăng", "bus", "đi"}},
                    {"Shopping", new[] {"mua", "shopping", "quần áo", "giày", "túi"}},
                    {"Bills & Utilities", new[] {"điện", "nước", "internet", "wifi", "hóa đơn"}},
                    {"Healthcare", new[] {"thuốc", "bệnh viện", "khám", "y tế"}}
                };

                foreach (var category in keywords)
                {
                    if (category.Value.Any(keyword => description.Contains(keyword)))
                        return category.Key;
                }
                return "Other";
            }
            return "Salary";
        }

        private string CapitalizeFirst(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            return char.ToUpper(input[0]) + input.Substring(1);
        }

        public async Task<bool> SendMessageAsync(long chatId, string text)
        {
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
                
                var payload = new
                {
                    chat_id = chatId,
                    text = text,
                    parse_mode = "HTML"
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                
                var response = await httpClient.PostAsync(url, content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending Telegram message");
                return false;
            }
        }

        public async Task<bool> SetWebhookAsync(string webhookUrl)
        {
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                var url = $"https://api.telegram.org/bot{_botToken}/setWebhook";
                
                var payload = new
                {
                    url = webhookUrl
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                
                var response = await httpClient.PostAsync(url, content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting webhook");
                return false;
            }
        }

        private async Task<User> EnsureUserExistsAsync(TelegramUserDto telegramUser)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.TelegramUserId == telegramUser.Id.ToString());

            if (user == null)
            {
                user = new User
                {
                    Username = telegramUser.Username ?? $"telegram_user_{telegramUser.Id}",
                    Email = $"{telegramUser.Id}@telegram.local",
                    PasswordHash = "telegram_user", // Placeholder
                    TelegramUserId = telegramUser.Id.ToString(),
                    Role = "customer",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create user profile
                var profile = new Userprofile
                {
                    UserId = user.UserId,
                    FirstName = telegramUser.FirstName,
                    LastName = telegramUser.LastName,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Userprofiles.Add(profile);
                await _context.SaveChangesAsync();
            }

            return user;
        }

        private async Task<Account> GetOrCreateDefaultAccountAsync(int userId)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (account == null)
            {
                account = new Account
                {
                    UserId = userId,
                    AccountName = "Ví Telegram",
                    AccountType = "cash",
                    CurrentBalance = 0,
                    CurrencyCode = "VND",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Accounts.Add(account);
                await _context.SaveChangesAsync();
            }

            return account;
        }

        private async Task<Category> GetOrCreateCategoryAsync(string categoryName, string transactionType)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryName == categoryName && c.TransactionType == transactionType);

            if (category == null)
            {
                category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == "Other" && 
                                            c.TransactionType == transactionType);
            }

            return category ?? throw new InvalidOperationException($"Category not found: {categoryName}");
        }
    }
}