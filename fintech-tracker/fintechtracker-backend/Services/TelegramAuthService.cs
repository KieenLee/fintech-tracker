using System.Security.Cryptography;
using System.Text;
using fintechtracker_backend.DTOs;
using Microsoft.Extensions.Configuration;

namespace fintechtracker_backend.Services
{
    public interface ITelegramAuthService
    {
        bool VerifyTelegramAuth(TelegramLoginDto telegramData);
        string GenerateDataCheckString(TelegramLoginDto telegramData);
    }

    public class TelegramAuthService : ITelegramAuthService
    {
        private readonly string _botToken;
        private readonly ILogger<TelegramAuthService> _logger;

        public TelegramAuthService(IConfiguration configuration, ILogger<TelegramAuthService> logger)
        {
            _botToken = configuration["Telegram:BotToken"]
                ?? throw new InvalidOperationException("Telegram Bot Token not configured");
            _logger = logger;
        }

        public bool VerifyTelegramAuth(TelegramLoginDto telegramData)
        {
            try
            {
                // 1. Check auth_date (không quá 1 ngày)
                var authDate = DateTimeOffset.FromUnixTimeSeconds(telegramData.AuthDate);
                if (DateTime.UtcNow - authDate > TimeSpan.FromDays(1))
                {
                    _logger.LogWarning("Telegram auth data expired");
                    return false;
                }

                // 2. Tạo data-check-string
                var dataCheckString = GenerateDataCheckString(telegramData);

                // 3. Tính secret_key = SHA256(bot_token)
                var secretKey = SHA256.HashData(Encoding.UTF8.GetBytes(_botToken));

                // 4. Tính hash = HMAC-SHA256(data-check-string, secret_key)
                using var hmac = new HMACSHA256(secretKey);
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataCheckString));
                var computedHashHex = BitConverter.ToString(computedHash).Replace("-", "").ToLower();

                // 5. So sánh với hash từ Telegram
                var isValid = computedHashHex == telegramData.Hash.ToLower();

                if (!isValid)
                {
                    _logger.LogWarning("Telegram auth hash verification failed");
                }

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying Telegram auth");
                return false;
            }
        }

        public string GenerateDataCheckString(TelegramLoginDto telegramData)
        {
            var fields = new SortedDictionary<string, string>
            {
                { "id", telegramData.Id.ToString() },
                { "auth_date", telegramData.AuthDate.ToString() }
            };

            if (!string.IsNullOrEmpty(telegramData.FirstName))
                fields["first_name"] = telegramData.FirstName;

            if (!string.IsNullOrEmpty(telegramData.LastName))
                fields["last_name"] = telegramData.LastName;

            if (!string.IsNullOrEmpty(telegramData.Username))
                fields["username"] = telegramData.Username;

            if (!string.IsNullOrEmpty(telegramData.PhotoUrl))
                fields["photo_url"] = telegramData.PhotoUrl;

            // Tạo chuỗi theo format: key=value\nkey=value...
            return string.Join("\n", fields.Select(kvp => $"{kvp.Key}={kvp.Value}"));
        }
    }
}