using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using BCrypt.Net;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingController : ControllerBase
    {
        private readonly FinTechDbContext _context;

        public SettingController(FinTechDbContext context)
        {
            _context = context;
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
                Email = user.Email,
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
            {
                return NotFound("User not found.");
            }

            var userProfile = await _context.Userprofiles.FirstOrDefaultAsync(p => p.UserId == userId);

            // Cập nhật thông tin user
            user.Email = updateDto.Email;
            user.UpdatedAt = DateTime.UtcNow;

            // Cập nhật profile
            if (userProfile != null)
            {
                userProfile.FirstName = updateDto.FirstName;
                userProfile.LastName = updateDto.LastName;

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

                // Validate currency
                var validCurrencies = new[] { "USD", "EUR", "GBP", "CNY", "VND" };
                if (!validCurrencies.Contains(updateDto.Currency))
                {
                    return BadRequest("Invalid currency code.");
                }

                // Cập nhật currency và language
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

            // Kiểm tra mật khẩu hiện tại
            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }

            // Kiểm tra mật khẩu mới và xác nhận
            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
            {
                return BadRequest("New password and confirm password do not match.");
            }

            // Validate độ mạnh mật khẩu (tối thiểu 6 ký tự)
            if (changePasswordDto.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters long.");
            }

            // Cập nhật mật khẩu mới
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

            // Cập nhật notifications
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
    }
}