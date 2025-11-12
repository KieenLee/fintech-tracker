using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Services;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using BCrypt.Net;
using Telegram.Bot;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingController : ControllerBase
    {
        private readonly FinTechDbContext _context;
        private readonly ITelegramAuthService _telegramAuthService;
        private readonly ITelegramBotClient _botClient;
        private readonly ILogger<SettingController> _logger;

        public SettingController(
            FinTechDbContext context,
            ITelegramAuthService telegramAuthService,
            ITelegramBotClient botClient,
            ILogger<SettingController> logger)
        {
            _context = context;
            _telegramAuthService = telegramAuthService;
            _botClient = botClient;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // GET: api/Setting
        [HttpGet]
        public async Task<ActionResult<UserSettingsResponseDto>> GetUserSettings()
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var userProfile = await _context.Userprofiles.FirstOrDefaultAsync(p => p.UserId == userId);

            // Parse settings từ JSON
            var settings = new JObject();
            if (userProfile != null && !string.IsNullOrEmpty(userProfile.Settings))
            {
                try
                {
                    settings = JObject.Parse(userProfile.Settings);
                }
                catch
                {
                    settings = new JObject();
                }
            }

            // Tạo default values nếu không có
            var notificationSettings = settings["notifications"]?.ToObject<NotificationSettingsDto>() ?? new NotificationSettingsDto
            {
                EmailNotifications = true,
                BudgetAlerts = true,
                GoalReminders = true,
                WeeklyReports = false
            };

            var privacySettings = settings["privacy"]?.ToObject<PrivacySettingsDto>() ?? new PrivacySettingsDto
            {
                DataSharing = false,
                AnalyticsTracking = true,
                MarketingEmails = false
            };

            var response = new UserSettingsResponseDto
            {
                FirstName = userProfile?.FirstName ?? "",
                LastName = userProfile?.LastName ?? "",
                Username = user.Username,
                Email = user.Email,
                PhoneNumber = userProfile?.Phone ?? "",
                Currency = settings["currency"]?.ToString() ?? "USD",
                Language = settings["language"]?.ToString() ?? "en",
                Notifications = notificationSettings,
                Privacy = privacySettings
            };

            return Ok(response);
        }

        // PUT: api/Setting/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateProfileDto updateDto)
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Validate username: không chứa ký tự đặc biệt, không trùng
            if (!System.Text.RegularExpressions.Regex.IsMatch(updateDto.Username, @"^[a-zA-Z0-9_]+$"))
                return BadRequest("Username must not contain special characters.");

            var usernameExists = await _context.Users
                .AnyAsync(u => u.Username == updateDto.Username && u.UserId != userId);
            if (usernameExists)
                return BadRequest("Username already exists.");

            // Validate phone (ví dụ: chỉ số, độ dài 9-15)
            if (!System.Text.RegularExpressions.Regex.IsMatch(updateDto.PhoneNumber, @"^\d{9,15}$"))
                return BadRequest("Invalid phone number format.");

            var userProfile = await _context.Userprofiles.FirstOrDefaultAsync(p => p.UserId == userId);

            // Cập nhật thông tin user
            user.Username = updateDto.Username;
            user.Email = updateDto.Email;
            user.UpdatedAt = DateTime.UtcNow;

            // Cập nhật profile
            if (userProfile != null)
            {
                userProfile.FirstName = updateDto.FirstName;
                userProfile.LastName = updateDto.LastName;
                userProfile.Phone = updateDto.PhoneNumber; // <-- Đúng chuẩn

                var settings = new JObject();
                if (!string.IsNullOrEmpty(userProfile.Settings))
                {
                    try { settings = JObject.Parse(userProfile.Settings); }
                    catch { settings = new JObject(); }
                }

                var validCurrencies = new[] { "USD", "EUR", "GBP", "CNY", "VND" };
                if (!validCurrencies.Contains(updateDto.Currency))
                    return BadRequest("Invalid currency code.");

                settings["currency"] = updateDto.Currency;
                settings["language"] = updateDto.Language;
                userProfile.Settings = settings.ToString(Formatting.None);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully." });
        }

        // PUT: api/Setting/change-password
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Check current password
            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }

            // Check new password and verifi
            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
            {
                return BadRequest("New password and confirm password do not match.");
            }

            // Validate strong password (at least 6)
            if (changePasswordDto.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters long.");
            }

            // Update new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        // PUT: api/Setting/notifications
        [HttpPut("notifications")]
        public async Task<IActionResult> UpdateNotificationSettings([FromBody] NotificationSettingsDto notificationDto)
        {
            var userId = GetCurrentUserId();
            var userProfile = await _context.Userprofiles.FirstOrDefaultAsync(p => p.UserId == userId);

            if (userProfile == null)
            {
                return NotFound("User profile not found.");
            }

            // Parse current settings
            var settings = new JObject();
            if (!string.IsNullOrEmpty(userProfile.Settings))
            {
                try
                {
                    settings = JObject.Parse(userProfile.Settings);
                }
                catch
                {
                    settings = new JObject();
                }
            }

            // Update notifications
            settings["notifications"] = JObject.FromObject(notificationDto);
            userProfile.Settings = settings.ToString(Formatting.None);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification settings updated successfully." });
        }

        // PUT: api/Setting/privacy
        [HttpPut("privacy")]
        public async Task<IActionResult> UpdatePrivacySettings([FromBody] PrivacySettingsDto privacyDto)
        {
            var userId = GetCurrentUserId();
            var userProfile = await _context.Userprofiles.FirstOrDefaultAsync(p => p.UserId == userId);

            if (userProfile == null)
            {
                return NotFound("User profile not found.");
            }

            // Parse settings hiện tại
            var settings = new JObject();
            if (!string.IsNullOrEmpty(userProfile.Settings))
            {
                try
                {
                    settings = JObject.Parse(userProfile.Settings);
                }
                catch
                {
                    settings = new JObject();
                }
            }

            // Cập nhật privacy
            settings["privacy"] = JObject.FromObject(privacyDto);
            userProfile.Settings = settings.ToString(Formatting.None);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Privacy settings updated successfully." });
        }

        // ===== TELEGRAM INTEGRATION ENDPOINTS =====

        // GET: api/Setting/telegram
        [HttpGet("telegram")]
        public async Task<ActionResult<TelegramLinkResponseDto>> GetTelegramLink()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var response = new TelegramLinkResponseDto
            {
                IsLinked = !string.IsNullOrEmpty(user.TelegramUserId),
                TelegramUserId = user.TelegramUserId,
                TelegramUsername = user.TelegramUsername,
                TelegramFirstName = user.TelegramFirstName,
                TelegramLastName = user.TelegramLastName,
                TelegramPhotoUrl = user.TelegramPhotoUrl,
                LinkedAt = user.TelegramLinkedAt
            };

            return Ok(response);
        }

        // POST: api/Setting/telegram/link
        [HttpPost("telegram/link")]
        public async Task<IActionResult> LinkTelegram([FromBody] TelegramLoginDto telegramData)
        {
            try
            {
                // 1. Verify hash từ Telegram
                if (!_telegramAuthService.VerifyTelegramAuth(telegramData))
                {
                    return BadRequest("Invalid Telegram authentication data.");
                }

                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound("User not found.");

                // 2. Check xem Telegram ID này đã được link chưa
                var existingLink = await _context.Users
                    .AnyAsync(u => u.TelegramUserId == telegramData.Id.ToString() && u.UserId != userId);

                if (existingLink)
                {
                    return BadRequest("This Telegram account is already linked to another user.");
                }

                // 3. Update user với thông tin Telegram
                user.TelegramUserId = telegramData.Id.ToString();
                user.TelegramUsername = telegramData.Username;
                user.TelegramFirstName = telegramData.FirstName;
                user.TelegramLastName = telegramData.LastName;
                user.TelegramPhotoUrl = telegramData.PhotoUrl;
                user.TelegramLinkedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // 4. Tạo/Cập nhật TelegramUsers record
                var telegramUser = await _context.TelegramUsers
                    .FirstOrDefaultAsync(t => t.TelegramUserId == telegramData.Id);

                if (telegramUser == null)
                {
                    telegramUser = new Models.TelegramUser
                    {
                        TelegramUserId = telegramData.Id,
                        UserId = userId,
                        ChatId = telegramData.Id, // Sẽ update khi user gửi message đầu tiên
                        FirstName = telegramData.FirstName,
                        LastName = telegramData.LastName,
                        Username = telegramData.Username,
                        IsActive = true
                    };
                    _context.TelegramUsers.Add(telegramUser);
                }
                else
                {
                    telegramUser.UserId = userId;
                    telegramUser.FirstName = telegramData.FirstName;
                    telegramUser.LastName = telegramData.LastName;
                    telegramUser.Username = telegramData.Username;
                    telegramUser.IsActive = true;
                }

                await _context.SaveChangesAsync();

                // 5. Gửi welcome message qua Bot
                try
                {
                    var welcomeMessage = $"🎉 **Chào mừng đến với FinTech Tracker!**\n\n" +
                                       $"Xin chào {telegramData.FirstName}! Tài khoản của bạn đã được liên kết thành công.\n\n" +
                                       $"✅ Bạn có thể bắt đầu sử dụng bot ngay bây giờ:\n" +
                                       $"• Ghi chép thu chi: \"Mua cafe 25k\"\n" +
                                       $"• Xem thống kê: \"Hôm nay tôi chi bao nhiêu?\"\n" +
                                       $"• Kiểm tra số dư: \"Số dư tài khoản?\"\n\n" +
                                       $"💡 Gửi /help để xem hướng dẫn chi tiết.";

                    await _botClient.SendTextMessageAsync(
                        chatId: telegramData.Id,
                        text: welcomeMessage,
                        parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown
                    );

                    _logger.LogInformation("Welcome message sent to Telegram user {TelegramId}", telegramData.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send welcome message to {TelegramId}", telegramData.Id);
                    // Don't fail the request if message sending fails
                }

                return Ok(new { message = "Telegram account linked successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking Telegram account");
                return StatusCode(500, "An error occurred while linking Telegram account.");
            }
        }

        // DELETE: api/Setting/telegram/unlink
        [HttpDelete("telegram/unlink")]
        public async Task<IActionResult> UnlinkTelegram()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrEmpty(user.TelegramUserId))
                return BadRequest("No Telegram account linked.");

            // Remove Telegram link
            var telegramUserId = user.TelegramUserId;

            user.TelegramUserId = null;
            user.TelegramUsername = null;
            user.TelegramFirstName = null;
            user.TelegramLastName = null;
            user.TelegramPhotoUrl = null;
            user.TelegramLinkedAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            // Deactivate TelegramUsers record
            var telegramUser = await _context.TelegramUsers
                .FirstOrDefaultAsync(t => t.TelegramUserId == long.Parse(telegramUserId));

            if (telegramUser != null)
            {
                telegramUser.IsActive = false;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} unlinked Telegram account {TelegramId}", userId, telegramUserId);

            return Ok(new { message = "Telegram account unlinked successfully." });
        }
    }
}