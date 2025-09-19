using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

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
                Name = userProfile?.FirstName ?? user.Username,
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
                userProfile.FirstName = updateDto.Name;

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

                // Cập nhật currency và language
                settings["currency"] = updateDto.Currency;
                settings["language"] = updateDto.Language;

                userProfile.Settings = settings.ToString(Formatting.None);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
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