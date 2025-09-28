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
            _botToken = _configuration["Telegram:BotToken"] ?? 
                       throw new InvalidOperationException("Telegram bot token not configured");
        }

        public async Task<TelegramProcessResult> ProcessMessageAsync(TelegramMessageDto message)
        {
            try
            {
                _logger.LogInformation($"Processing message from user {message.From.Id}: {message.Text}");

                // Handle commands first
                if (message.Text?.StartsWith("/") == true)
                {
                    return await HandleCommandAsync(message);
                }

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
                if (parseResult.TransactionType == "expense")
                {
                    account.CurrentBalance -= Math.Abs(parseResult.Amount);
                }
                else
                {
                    account.CurrentBalance += Math.Abs(parseResult.Amount);
                }
                
                account.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();

                var responseMessage = parseResult.TransactionType == "expense"
                    ? $"✅ <b>Chi tiêu đã ghi nhận</b>\n" +
                      $"💸 <b>{parseResult.Description}</b> - {Math.Abs(parseResult.Amount):N0}đ\n" +
                      $"📂 Danh mục: {parseResult.CategoryName}\n" +
                      $"💰 Số dư còn: <b>{account.CurrentBalance:N0}đ</b>"
                    : $"✅ <b>Thu nhập đã ghi nhận</b>\n" +
                      $"💰 <b>{parseResult.Description}</b> - {parseResult.Amount:N0}đ\n" +
                      $"📂 Danh mục: {parseResult.CategoryName}\n" +
                      $"💰 Số dư hiện tại: <b>{account.CurrentBalance:N0}đ</b>";

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

        private async Task<TelegramProcessResult> HandleCommandAsync(TelegramMessageDto message)
        {
            var command = message.Text?.ToLower().Trim();
            
            return command switch
            {
                "/start" => new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = "🎉 <b>Chào mừng đến với FinTech Tracker Bot!</b>\n\n" +
                                    "💡 <b>Cách sử dụng:</b>\n" +
                                    "• Ghi chi tiêu: <code>mua cafe 25k</code>\n" +
                                    "• Ghi thu nhập: <code>lương tháng 15tr</code>\n" +
                                    "• Xem số dư: <code>/balance</code>\n" +
                                    "• Xem lịch sử: <code>/history</code>\n\n" +
                                    "Hãy thử gửi: <code>mua cafe 20k</code>"
                },
                "/help" => new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = "🤖 <b>Hướng dẫn sử dụng Bot</b>\n\n" +
                                    "📝 <b>Ghi chi tiêu:</b>\n" +
                                    "• <code>mua [mô tả] [số tiền]</code>\n" +
                                    "• <code>chi [mô tả] [số tiền]</code>\n" +
                                    "• Ví dụ: <code>mua cafe 25k</code>\n\n" +
                                    "💰 <b>Ghi thu nhập:</b>\n" +
                                    "• <code>lương [mô tả] [số tiền]</code>\n" +
                                    "• <code>thu [mô tả] [số tiền]</code>\n" +
                                    "• Ví dụ: <code>lương tháng 15tr</code>\n\n" +
                                    "🔢 <b>Đơn vị tiền:</b>\n" +
                                    "• <code>k</code> = nghìn (25k = 25,000)\n" +
                                    "• <code>tr</code> = triệu (2tr = 2,000,000)"
                },
                "/balance" => await GetBalanceAsync(message),
                "/history" => await GetHistoryAsync(message),
                _ => new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = "❓ Lệnh không hợp lệ. Gửi /help để xem hướng dẫn."
                }
            };
        }

        private async Task<TelegramProcessResult> GetBalanceAsync(TelegramMessageDto message)
        {
            try
            {
                var user = await EnsureUserExistsAsync(message.From);
                var accounts = await _context.Accounts
                    .Where(a => a.UserId == user.UserId && a.IsActive == true)
                    .ToListAsync();

                if (!accounts.Any())
                {
                    return new TelegramProcessResult
                    {
                        ShouldRespond = true,
                        ResponseMessage = "💰 Bạn chưa có tài khoản nào. Hãy thử ghi một giao dịch đầu tiên!"
                    };
                }

                var totalBalance = accounts.Sum(a => a.CurrentBalance);
                var response = "💰 <b>Số dư tài khoản</b>\n\n";
                
                foreach (var account in accounts)
                {
                    response += $"📱 {account.AccountName}: <b>{account.CurrentBalance:N0}đ</b>\n";
                }
                
                response += $"\n💎 <b>Tổng cộng: {totalBalance:N0}đ</b>";

                return new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting balance");
                return new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = "❌ Không thể lấy thông tin số dư."
                };
            }
        }

        private async Task<TelegramProcessResult> GetHistoryAsync(TelegramMessageDto message)
        {
            try
            {
                var user = await EnsureUserExistsAsync(message.From);
                var transactions = await _context.Transactions
                    .Include(t => t.Category)
                    .Where(t => t.UserId == user.UserId)
                    .OrderByDescending(t => t.TransactionDate)
                    .Take(10)
                    .ToListAsync();

                if (!transactions.Any())
                {
                    return new TelegramProcessResult
                    {
                        ShouldRespond = true,
                        ResponseMessage = "📝 Chưa có giao dịch nào. Hãy thử ghi một giao dịch đầu tiên!"
                    };
                }

                var response = "📊 <b>10 giao dịch gần nhất</b>\n\n";
                
                foreach (var transaction in transactions)
                {
                    var icon = transaction.TransactionType == "expense" ? "💸" : "💰";
                    var amount = transaction.TransactionType == "expense" 
                        ? $"-{Math.Abs(transaction.Amount):N0}đ" 
                        : $"+{Math.Abs(transaction.Amount):N0}đ";
                    
                    response += $"{icon} <b>{transaction.Description}</b>\n";
                    response += $"   {amount} • {transaction.Category?.CategoryName}\n";
                    response += $"   📅 {transaction.TransactionDate:dd/MM HH:mm}\n\n";
                }

                return new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting history");
                return new TelegramProcessResult
                {
                    ShouldRespond = true,
                    ResponseMessage = "❌ Không thể lấy lịch sử giao dịch."
                };
            }
        }

        private MessageParseResult ParseTransactionMessage(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return new MessageParseResult
                {
                    IsValid = false,
                    ErrorMessage = "❌ Tin nhắn trống. Hãy thử: <code>mua cafe 25k</code>"
                };
            }

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
                    
                    if (amount <= 0)
                    {
                        return new MessageParseResult
                        {
                            IsValid = false,
                            ErrorMessage = "❌ Số tiền không hợp lệ. Ví dụ: <code>mua cafe 25k</code>"
                        };
                    }
                    
                    return new MessageParseResult
                    {
                        IsValid = true,
                        Amount = amount,
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
                    
                    if (amount <= 0)
                    {
                        return new MessageParseResult
                        {
                            IsValid = false,
                            ErrorMessage = "❌ Số tiền không hợp lệ. Ví dụ: <code>lương tháng 15tr</code>"
                        };
                    }
                    
                    return new MessageParseResult
                    {
                        IsValid = true,
                        Amount = amount,
                        Description = CapitalizeFirst(description),
                        TransactionType = "income",
                        CategoryName = "Salary"
                    };
                }
            }

            return new MessageParseResult
            {
                IsValid = false,
                ErrorMessage = "❌ Không hiểu tin nhắn.\n\n💡 <b>Thử:</b>\n" +
                              "• <code>mua cafe 25k</code>\n" +
                              "• <code>lương tháng 15tr</code>\n" +
                              "• <code>xe grab 50k</code>\n\n" +
                              "Gửi /help để xem hướng dẫn chi tiết."
            };
        }

        // Helper methods (ParseAmount, ExtractDescription, etc.)
        private decimal ParseAmount(Match match)
        {
            for (int i = match.Groups.Count - 2; i >= 1; i--)
            {
                if (Regex.IsMatch(match.Groups[i].Value, @"^\d+$"))
                {
                    if (decimal.TryParse(match.Groups[i].Value, out decimal amount))
                    {
                        var unit = match.Groups[i + 1].Value;
                        
                        return unit switch
                        {
                            "k" => amount * 1000,
                            "tr" => amount * 1000000,
                            _ => amount
                        };
                    }
                }
            }
            return 0;
        }

        private string ExtractDescription(Match match, string originalText)
        {
            var excludeWords = new[] { "mua", "chi", "trả", "tiêu", "lương", "thưởng", "nhận", "thu" };
            
            for (int i = 1; i < match.Groups.Count - 2; i++)
            {
                var group = match.Groups[i].Value.Trim();
                if (!string.IsNullOrEmpty(group) && !excludeWords.Contains(group))
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
                    {"Food & Dining", new[] {"cafe", "cà phê", "ăn", "uống", "cơm", "phở", "bún", "bánh", "trà", "nước"}},
                    {"Transportation", new[] {"xe", "taxi", "grab", "xăng", "bus", "đi", "uber", "motorbike", "oto"}},
                    {"Shopping", new[] {"mua", "shopping", "quần áo", "giày", "túi", "đồ", "sách"}},
                    {"Bills & Utilities", new[] {"điện", "nước", "internet", "wifi", "hóa đơn", "tiền nhà", "rent"}},
                    {"Healthcare", new[] {"thuốc", "bệnh viện", "khám", "y tế", "doctor", "medicine"}},
                    {"Entertainment", new[] {"phim", "game", "karaoke", "bar", "club", "vui chơi"}}
                };

                foreach (var category in keywords)
                {
                    if (category.Value.Any(keyword => description.ToLower().Contains(keyword)))
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
                var responseContent = await response.Content.ReadAsStringAsync();
                
                _logger.LogInformation($"Telegram API Response: {response.StatusCode} - {responseContent}");
                
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
                var responseContent = await response.Content.ReadAsStringAsync();
                
                _logger.LogInformation($"Set webhook response: {response.StatusCode} - {responseContent}");
                
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting webhook");
                return false;
            }
        }

        public async Task<string> GetBotInfoAsync()
        {
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                var url = $"https://api.telegram.org/bot{_botToken}/getMe";
                
                var response = await httpClient.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();
                
                return responseContent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bot info");
                return $"Error: {ex.Message}";
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
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("telegram_user"),
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

                _logger.LogInformation($"Created new Telegram user: {user.UserId}");
            }

            return user;
        }

        private async Task<Account> GetOrCreateDefaultAccountAsync(int userId)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.UserId == userId && a.IsActive == true);

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

                _logger.LogInformation($"Created default account for user: {userId}");
            }

            return account;
        }

        private async Task<Category> GetOrCreateCategoryAsync(string categoryName, string transactionType)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryName == categoryName && c.TransactionType == transactionType);

            if (category == null)
            {
                // Try to find "Other" category as fallback
                category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == "Other" && c.TransactionType == transactionType);

                // If still null, create a new category
                if (category == null)
                {
                    category = new Category
                    {
                        CategoryName = categoryName,
                        TransactionType = transactionType,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Created new category: {categoryName} - {transactionType}");
                }
            }

            return category;
        }
    }
}